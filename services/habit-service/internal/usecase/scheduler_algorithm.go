package usecase

import (
	"fmt"
	"sort"
	"strconv"
	"strings"

	"github.com/habitizer/services/habit-service/internal/domain"
)

type timeInterval struct {
	startMin int
	endMin   int
	title    string
	kind     string
}

func ParseTimeToMinutes(timeStr string) int {
	parts := strings.Split(strings.TrimSpace(timeStr), ":")
	if len(parts) < 2 {
		return 0
	}
	h, _ := strconv.Atoi(parts[0])
	m, _ := strconv.Atoi(parts[1])
	return h*60 + m
}

func MinutesToTimeString(totalMinutes int) string {
	if totalMinutes < 0 {
		totalMinutes = 0
	}
	h := (totalMinutes / 60) % 24
	m := totalMinutes % 60
	return fmt.Sprintf("%02d:%02d", h, m)
}

func getPeriodForMinutes(min int) string {
	if min < 12*60 {
		return "Morning"
	} else if min < 14*60 {
		return "Midday"
	} else if min < 18*60 {
		return "Afternoon"
	}
	return "Evening"
}

func CalculateFreeSlots(events []domain.CalendarEventDTO, targetDate, dayStart, dayEnd string) []*domain.FreeSlotDTO {
	if dayStart == "" {
		dayStart = "07:00"
	}
	if dayEnd == "" {
		dayEnd = "22:00"
	}

	startBoundary := ParseTimeToMinutes(dayStart)
	endBoundary := ParseTimeToMinutes(dayEnd)

	var busy []timeInterval
	for _, ev := range events {
		if ev.Date == "" || ev.Date == targetDate {
			s := ParseTimeToMinutes(ev.StartTime)
			e := ParseTimeToMinutes(ev.EndTime)
			if e > s && s < endBoundary && e > startBoundary {
				busy = append(busy, timeInterval{
					startMin: max(s, startBoundary),
					endMin:   min(e, endBoundary),
					title:    ev.Title,
					kind:     "event",
				})
			}
		}
	}

	sort.Slice(busy, func(i, j int) bool {
		return busy[i].startMin < busy[j].startMin
	})

	var freeSlots []*domain.FreeSlotDTO
	currentPtr := startBoundary

	for idx, b := range busy {
		if b.startMin > currentPtr {
			duration := b.startMin - currentPtr
			if duration >= 15 {
				sTime := MinutesToTimeString(currentPtr)
				eTime := MinutesToTimeString(b.startMin)
				freeSlots = append(freeSlots, &domain.FreeSlotDTO{
					ID:              fmt.Sprintf("slot_%s_%d", targetDate, idx),
					Date:            targetDate,
					StartTime:       sTime,
					EndTime:         eTime,
					DurationMinutes: duration,
					Period:          getPeriodForMinutes(currentPtr),
					Label:           fmt.Sprintf("Open slot %s-%s (%dm)", sTime, eTime, duration),
					IsFreeSlot:      true,
				})
			}
		}
		if b.endMin > currentPtr {
			currentPtr = b.endMin
		}
	}

	if currentPtr < endBoundary {
		duration := endBoundary - currentPtr
		if duration >= 15 {
			sTime := MinutesToTimeString(currentPtr)
			eTime := MinutesToTimeString(endBoundary)
			freeSlots = append(freeSlots, &domain.FreeSlotDTO{
				ID:              fmt.Sprintf("slot_%s_end", targetDate),
				Date:            targetDate,
				StartTime:       sTime,
				EndTime:         eTime,
				DurationMinutes: duration,
				Period:          getPeriodForMinutes(currentPtr),
				Label:           fmt.Sprintf("Evening free block %s-%s (%dm)", sTime, eTime, duration),
				IsFreeSlot:      true,
			})
		}
	}

	return freeSlots
}

func DetectEventHabitConflicts(habits []*domain.Habit, events []domain.CalendarEventDTO, targetDate string) []*domain.ConflictReportDTO {
	var reports []*domain.ConflictReportDTO
	for _, h := range habits {
		if !h.IsActive {
			continue
		}
		hStart := ParseTimeToMinutes(h.ScheduledTime)
		hEnd := hStart + 30

		for _, ev := range events {
			if ev.Date == "" || ev.Date == targetDate {
				eStart := ParseTimeToMinutes(ev.StartTime)
				eEnd := ParseTimeToMinutes(ev.EndTime)
				if max(hStart, eStart) < min(hEnd, eEnd) {
					reports = append(reports, &domain.ConflictReportDTO{
						HabitID:     h.ID,
						HabitTitle:  h.ReplacementHabit,
						EventID:     ev.ID,
						EventTitle:  ev.Title,
						ConflictAt:  h.ScheduledTime,
						EventWindow: fmt.Sprintf("%s - %s", ev.StartTime, ev.EndTime),
					})
				}
			}
		}
	}
	return reports
}

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}

func max(a, b int) int {
	if a > b {
		return a
	}
	return b
}

