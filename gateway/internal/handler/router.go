package handler

import (
	"bufio"
	"fmt"
	"net/http"
	"net/http/httputil"
	"net/url"
	"os"
	"os/exec"
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

	// Resolve web directory
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
	candidates := []string{
		"web",
		"./web",
		"../web",
		"../../web",
	}
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
	// Enable CORS for all responses (allows local phone access)
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With")

	if req.Method == http.MethodOptions {
		w.WriteHeader(http.StatusOK)
		return
	}

	path := req.URL.Path

	// Health Check
	if path == "/health" {
		response.JSON(w, http.StatusOK, map[string]string{
			"status":  "UP",
			"service": "gateway-service",
			"version": "1.0.0",
		}, "API Gateway Healthy")
		return
	}

	// OpenAPI Specification JSON Endpoint
	if path == "/api/openapi.json" || path == "/swagger/openapi.json" || path == "/openapi.json" {
		w.Header().Set("Content-Type", "application/json")
		http.ServeFile(w, req, filepath.Join(r.webDir, "swagger", "openapi.json"))
		return
	}

	// Gateway Routing to Isolated Microservices
	switch {
	case strings.HasPrefix(path, "/api/v1/auth"):
		r.log.Info("Routing to Auth Service: %s %s", req.Method, path)
		r.authProxy.ServeHTTP(w, req)
		return

	case strings.HasPrefix(path, "/api/v1/habits"):
		r.log.Info("Routing to Habit Service: %s %s", req.Method, path)
		r.habitProxy.ServeHTTP(w, req)
		return

	case strings.HasPrefix(path, "/api/v1/analytics"):
		r.log.Info("Routing to Analytics Service: %s %s", req.Method, path)
		r.analyticsProxy.ServeHTTP(w, req)
		return
	}

	// Static Web Serving with Clean URLs
	r.serveStaticWithCleanURLs(w, req)
}

func (r *Router) serveStaticWithCleanURLs(w http.ResponseWriter, req *http.Request) {
	path := req.URL.Path

	// Root path -> index.html (Welcome Page)
	if path == "/" || path == "" {
		http.ServeFile(w, req, filepath.Join(r.webDir, "index.html"))
		return
	}

	// Clean URLs without extension (e.g. /shop -> /shop.html, /about -> /about.html)
	if !strings.Contains(filepath.Base(path), ".") {
		cleanName := strings.Trim(path, "/") + ".html"
		targetFile := filepath.Join(r.webDir, cleanName)
		if stat, err := os.Stat(targetFile); err == nil && !stat.IsDir() {
			http.ServeFile(w, req, targetFile)
			return
		}
	}

	// Standard Static File Serving
	r.fileServer.ServeHTTP(w, req)
}

func (r *Router) handleRunTestsSSE(w http.ResponseWriter, req *http.Request) {
	flusher, ok := w.(http.Flusher)
	if !ok {
		http.Error(w, "Streaming unsupported", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "text/event-stream")
	w.Header().Set("Cache-Control", "no-cache")
	w.Header().Set("Connection", "keep-alive")

	sendMsg := func(msg string) {
		fmt.Fprintf(w, "data: %s\n\n", msg)
		flusher.Flush()
	}

	sendMsg("Initializing Habitizer Integration Test Suite...")

	// Find project root directory
	rootDir := findProjectRoot()
	sendMsg(fmt.Sprintf("Working Directory: %s", rootDir))

	testProject := filepath.Join(rootDir, "tests", "IntegrationTests")
	cmd := exec.Command("go", "run", ".")
	cmd.Dir = testProject

	stdout, err := cmd.StdoutPipe()
	if err != nil {
		sendMsg(fmt.Sprintf("ERROR: Failed to capture stdout: %v", err))
		return
	}
	stderr, err := cmd.StderrPipe()
	if err != nil {
		sendMsg(fmt.Sprintf("ERROR: Failed to capture stderr: %v", err))
		return
	}

	if err := cmd.Start(); err != nil {
		sendMsg(fmt.Sprintf("ERROR: Failed to start test runner: %v", err))
		return
	}

	// Stream stdout
	go func() {
		scanner := bufio.NewScanner(stdout)
		for scanner.Scan() {
			sendMsg(scanner.Text())
		}
	}()

	// Stream stderr
	go func() {
		scanner := bufio.NewScanner(stderr)
		for scanner.Scan() {
			sendMsg(fmt.Sprintf("STDERR: %s", scanner.Text()))
		}
	}()

	if err := cmd.Wait(); err != nil {
		sendMsg(fmt.Sprintf("[EXIT] %v", cmd.ProcessState.ExitCode()))
	} else {
		sendMsg("[EXIT] 0")
	}
}

func findProjectRoot() string {
	cwd, err := os.Getwd()
	if err == nil {
		if _, err := os.Stat(filepath.Join(cwd, "tests", "IntegrationTests")); err == nil {
			return cwd
		}
		parent := filepath.Dir(cwd)
		if _, err := os.Stat(filepath.Join(parent, "tests", "IntegrationTests")); err == nil {
			return parent
		}
	}
	return "."
}
