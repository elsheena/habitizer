package errors

import "errors"

var (
	ErrNotFound          = errors.New("requested resource not found")
	ErrUnauthorized      = errors.New("unauthorized access")
	ErrForbidden         = errors.New("access forbidden")
	ErrInvalidInput      = errors.New("invalid input data")
	ErrConflict          = errors.New("resource already exists")
	ErrInternalServer    = errors.New("internal server error")
	ErrHabitAlreadyExist = errors.New("habit mapping already exists")
	ErrHabitNotFound     = errors.New("habit not found")
)
