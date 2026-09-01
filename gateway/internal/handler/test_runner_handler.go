package handler

import (
	"bufio"
	"fmt"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
)

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

	go func() {
		scanner := bufio.NewScanner(stdout)
		for scanner.Scan() {
			sendMsg(scanner.Text())
		}
	}()

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
