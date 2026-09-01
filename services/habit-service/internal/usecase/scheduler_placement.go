package usecase

import (
	"fmt"

	"github.com/habitizer/services/habit-service/internal/domain"
)

// SmartAutoSchedule places each habit into the nearest free calendar slot based on its preferred time window.
func SmartAutoSchedule(habits []*domain.Habit, events []domain.CalendarEventDTO, targetDate string) (*domain.AutoScheduleResponseDTO, []*domain.Habit) {
	freeSlots := CalculateFreeSlots(events, targetDate, "07:00", "22:00")
	var updated []*domain.Habit
	adjustments := 0

	// Track which slots have been claimed (by their start minutes) to avoid double-booking
	claimedSlots := make(map[int]bool)

	for _, h := range habits {
		if !h.IsActive {
			continue
		}
		hCopy := *h

		// Determine the target center minute from preferred window or scheduled time
		targetMin := preferredCenterMinute(&hCopy)
		bestSlot := findNearestFreeSlot(freeSlots, claimedSlots, targetMin, 30)

		if bestSlot != nil {
			hCopy.ScheduledTime = bestSlot.StartTime
			claimedSlots[ParseTimeToMinutes(bestSlot.StartTime)] = true
			adjustments++
		}
		updated = append(updated, &hCopy)
	}

	msg := fmt.Sprintf("Scheduled %d habits into their nearest free calendar slots.", adjustments)
	return &domain.AutoScheduleResponseDTO{
		Habits:           updated,
		AdjustmentsCount: adjustments,
		Message:          msg,
	}, updated
}

// preferredCenterMinute returns the midpoint of the habit's preferred window, or its scheduled time.
func preferredCenterMinute(h *domain.Habit) int {
	if h.PreferredWindowStart != "" && h.PreferredWindowEnd != "" {
		s := ParseTimeToMinutes(h.PreferredWindowStart)
		e := ParseTimeToMinutes(h.PreferredWindowEnd)
		if e > s {
			return (s + e) / 2
		}
	}
	if h.ScheduledTime != "" {
		return ParseTimeToMinutes(h.ScheduledTime)
	}
	return 9 * 60 // default 09:00
}

// findNearestFreeSlot finds the unclaimed free slot closest to targetMin that can fit durationMin.
func findNearestFreeSlot(slots []*domain.FreeSlotDTO, claimed map[int]bool, targetMin, durationMin int) *domain.FreeSlotDTO {
	var bestSlot *domain.FreeSlotDTO
	bestDist := 24 * 60 // max possible distance

	for _, slot := range slots {
		slotStart := ParseTimeToMinutes(slot.StartTime)
		if claimed[slotStart] {
			continue
		}
		if slot.DurationMinutes < durationMin {
			continue
		}

		// Distance from target to slot center
		slotCenter := slotStart + slot.DurationMinutes/2
		dist := slotCenter - targetMin
		if dist < 0 {
			dist = -dist
		}

		if dist < bestDist {
			bestDist = dist
			bestSlot = slot
		}
	}
	return bestSlot
}
