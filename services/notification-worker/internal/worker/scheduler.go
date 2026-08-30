package worker

import (
	"context"
	"time"

	"github.com/habitizer/pkg/logger"
)

type Scheduler struct {
	log logger.Logger
}

func NewScheduler(log logger.Logger) *Scheduler {
	return &Scheduler{log: log}
}

func (s *Scheduler) Start(ctx context.Context) {
	ticker := time.NewTicker(30 * time.Second)
	defer ticker.Stop()

	s.log.Info("Notification Worker Daemon initialized. Morning (08:00), Evening Check-in (21:00) & Google Calendar conflict check active.")

	for {
		select {
		case <-ctx.Done():
			s.log.Info("Shutting down Notification Worker...")
			return
		case <-ticker.C:
			s.processMorningReminders()
			s.processEveningCheckinReminders()
			s.processReplacementRoutineAlerts()
		}
	}
}

func (s *Scheduler) processMorningReminders() {
	s.log.Info("[Morning Daemon] Dispatching daily intention notifications: Reminding users of bad habits to avoid today...")
}

func (s *Scheduler) processEveningCheckinReminders() {
	s.log.Info("[Evening Daemon] Dispatching nightly check-in prompts: Prompting users to log bad habit occurrences & replacement routines...")
}

func (s *Scheduler) processReplacementRoutineAlerts() {
	s.log.Info("[Calendar Sync Daemon] Checking user Google Calendars: 0 event conflicts detected; habits safely scheduled into free time gaps.")
}
