package http

import (
	"encoding/json"
	"net/http"

	"github.com/habitizer/pkg/response"
	"github.com/habitizer/services/auth-service/internal/domain"
	"github.com/habitizer/services/auth-service/internal/usecase"
)

type AuthHandler struct {
	usecase usecase.AuthUsecase
}

func NewAuthHandler(uc usecase.AuthUsecase) *AuthHandler {
	return &AuthHandler{usecase: uc}
}

func (h *AuthHandler) Register(w http.ResponseWriter, r *http.Request) {
	var dto domain.RegisterDTO
	if err := json.NewDecoder(r.Body).Decode(&dto); err != nil {
		response.Error(w, http.StatusBadRequest, "Invalid request payload", err.Error())
		return
	}

	res, err := h.usecase.Register(r.Context(), dto)
	if err != nil {
		response.Error(w, http.StatusBadRequest, err.Error(), nil)
		return
	}

	response.JSON(w, http.StatusCreated, res, "User registered successfully")
}

func (h *AuthHandler) Login(w http.ResponseWriter, r *http.Request) {
	var dto domain.LoginDTO
	if err := json.NewDecoder(r.Body).Decode(&dto); err != nil {
		response.Error(w, http.StatusBadRequest, "Invalid request payload", err.Error())
		return
	}

	res, err := h.usecase.Login(r.Context(), dto)
	if err != nil {
		response.Error(w, http.StatusUnauthorized, err.Error(), nil)
		return
	}

	response.JSON(w, http.StatusOK, res, "Login successful")
}
