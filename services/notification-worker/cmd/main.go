package main

import (
	"context"
	"os"
	"os/signal"
	"syscall"

	"github.com/habitizer/pkg/logger"
	"github.com/habitizer/services/notification-worker/internal/worker"
)

func main() {
	log := logger.NewLogger("notification-worker")

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	// Handle graceful shutdown
	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)

	scheduler := worker.NewScheduler(log)

	go func() {
		<-sigChan
		log.Info("Termination signal received.")
		cancel()
	}()

	scheduler.Start(ctx)
}
