package handler

import (
	"net/http"
	"net/http/httputil"
	"net/url"
	"os"
	"path/filepath"
	"strings"

	"github.com/habitizer/gateway/config"
	"github.com/habitizer/pkg/logger"
	"github.com/habitizer/pkg/response"
)

type Router struct {
	cfg            *config.Config
	log            logger.Logger
	authProxy      *httputil.ReverseProxy
	habitProxy     *httputil.ReverseProxy
	analyticsProxy *httputil.ReverseProxy
	webDir         string
	fileServer     http.Handler
}

func NewRouter(cfg *config.Config, log logger.Logger) *Router {
	authTarget, _ := url.Parse(cfg.AuthServiceURL)
	habitTarget, _ := url.Parse(cfg.HabitServiceURL)
	analyticsTarget, _ := url.Parse(cfg.AnalyticsServiceURL)

	webDir := findWebDir()
	log.Info("Serving static frontend files from: %s", webDir)

	return &Router{
		cfg:            cfg,
		log:            log,
		authProxy:      httputil.NewSingleHostReverseProxy(authTarget),
		habitProxy:     httputil.NewSingleHostReverseProxy(habitTarget),
		analyticsProxy: httputil.NewSingleHostReverseProxy(analyticsTarget),
		webDir:         webDir,
		fileServer:     http.FileServer(http.Dir(webDir)),
	}
}

func findWebDir() string {
	candidates := []string{"web", "./web", "../web", "../../web"}
	cwd, err := os.Getwd()
	if err == nil {
		candidates = append(candidates, filepath.Join(cwd, "web"))
	}
	for _, c := range candidates {
		if stat, err := os.Stat(c); err == nil && stat.IsDir() {
			abs, err := filepath.Abs(c)
			if err == nil {
				return abs
			}
			return c
		}
	}
	return "web"
}

func (r *Router) ServeHTTP(w http.ResponseWriter, req *http.Request) {
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With")

	if req.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}

	path := req.URL.Path

	if path == "/health" {
		response.JSON(w, http.StatusOK, map[string]string{
			"status":  "UP",
			"service": "gateway-service",
			"version": "1.0.0",
		}, "API Gateway Healthy")
		return
	}

	if path == "/api/run-tests" {
		r.handleRunTestsSSE(w, req)
		return
	}

	if path == "/api/openapi.json" || path == "/swagger/openapi.json" || path == "/openapi.json" {
		w.Header().Set("Content-Type", "application/json")
		http.ServeFile(w, req, filepath.Join(r.webDir, "swagger", "openapi.json"))
		return
	}

	switch {
	case strings.HasPrefix(path, "/api/v1/auth"):
		r.authProxy.ServeHTTP(w, req)
		return
	case strings.HasPrefix(path, "/api/v1/habits"):
		r.habitProxy.ServeHTTP(w, req)
		return
	case strings.HasPrefix(path, "/api/v1/analytics"):
		r.analyticsProxy.ServeHTTP(w, req)
		return
	}

	r.serveStaticWithCleanURLs(w, req)
}

func (r *Router) serveStaticWithCleanURLs(w http.ResponseWriter, req *http.Request) {
	path := req.URL.Path

	if path == "/" || path == "" {
		http.ServeFile(w, req, filepath.Join(r.webDir, "index.html"))
		return
	}

	if !strings.Contains(filepath.Base(path), ".") {
		cleanName := strings.Trim(path, "/") + ".html"
		targetFile := filepath.Join(r.webDir, cleanName)
		if stat, err := os.Stat(targetFile); err == nil && !stat.IsDir() {
			http.ServeFile(w, req, targetFile)
			return
		}
	}

	r.fileServer.ServeHTTP(w, req)
}
