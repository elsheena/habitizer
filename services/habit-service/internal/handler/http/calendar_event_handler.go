package http

import (
	"encoding/json"
	"net/http"

	"github.com/habitizer/pkg/response"
	"github.com/habitizer/services/habit-service/internal/domain"
	"github.com/habitizer/services/habit-service/internal/usecase"
)

// CalendarEventHandler handles CRUD HTTP endpoints for user timetable calendar events.
type CalendarEventHandler struct {
	usecase usecase.CalendarEventUsecase
}

func NewCalendarEventHandler(uc usecase.CalendarEventUsecase) *CalendarEventHandler {
	return &CalendarEventHandler{usecase: uc}
}

// HandleCalendarEvents routes GET, POST, PUT, DELETE for /api/v1/habits/calendar-events
func (h *CalendarEventHandler) HandleCalendarEvents(w http.ResponseWriter, r *http.Request) {
	switch r.Method {
	case http.MethodGet:
		userID := r.URL.Query().Get("user_id")
		if userID == "" {
			userID = "usr_demo"
		}
		events, err := h.usecase.GetCalendarEvents(r.Context(), userID)
		if err != nil {
			response.Error(w, http.StatusInternalServerError, err.Error(), nil)
			return
		}
		response.JSON(w, http.StatusOK, events, "Calendar events retrieved")

	case http.MethodPost:
		var dto domain.CalendarEventDTO
		if err := json.NewDecoder(r.Body).Decode(&dto); err != nil {
			response.Error(w, http.StatusBadRequest, "Invalid event payload", err.Error())
			return
		}
		ev, err := h.usecase.CreateCalendarEvent(r.Context(), dto)
		if err != nil {
			response.Error(w, http.StatusBadRequest, err.Error(), nil)
			return
		}
		response.JSON(w, http.StatusCreated, ev, "Calendar event created successfully")

	case http.MethodPut:
		var dto domain.CalendarEventDTO
		if err := json.NewDecoder(r.Body).Decode(&dto); err != nil {
			response.Error(w, http.StatusBadRequest, "Invalid event payload", err.Error())
			return
		}
		id := r.URL.Query().Get("id")
		if id != "" {
			dto.ID = id
		}
		ev, err := h.usecase.UpdateCalendarEvent(r.Context(), dto)
		if err != nil {
			response.Error(w, http.StatusBadRequest, err.Error(), nil)
			return
		}
		response.JSON(w, http.StatusOK, ev, "Calendar event updated successfully")

	case http.MethodDelete:
		id := r.URL.Query().Get("id")
		if id == "" {
			response.Error(w, http.StatusBadRequest, "id query param required", nil)
			return
		}
		if err := h.usecase.DeleteCalendarEvent(r.Context(), id); err != nil {
			response.Error(w, http.StatusBadRequest, err.Error(), nil)
			return
		}
		response.JSON(w, http.StatusOK, nil, "Calendar event deleted successfully")

	default:
		response.Error(w, http.StatusMethodNotAllowed, "Method not allowed", nil)
	}
}
