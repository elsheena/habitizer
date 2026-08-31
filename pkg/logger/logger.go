package logger

import (
	"log"
	"os"
)

type Logger interface {
	Info(msg string, args ...interface{})
	Warn(msg string, args ...interface{})
	Error(msg string, args ...interface{})
	Debug(msg string, args ...interface{})
}

type StdLogger struct {
	infoLog  *log.Logger
	warnLog  *log.Logger
	errorLog *log.Logger
	debugLog *log.Logger
}

func NewLogger(serviceName string) Logger {
	prefix := "[" + serviceName + "] "
	return &StdLogger{
		infoLog:  log.New(os.Stdout, prefix+"INFO: ", log.LstdFlags|log.Lshortfile),
		warnLog:  log.New(os.Stdout, prefix+"WARN: ", log.LstdFlags|log.Lshortfile),
		errorLog: log.New(os.Stderr, prefix+"ERROR: ", log.LstdFlags|log.Lshortfile),
		debugLog: log.New(os.Stdout, prefix+"DEBUG: ", log.LstdFlags|log.Lshortfile),
	}
}

func (l *StdLogger) Info(msg string, args ...interface{}) {
	if len(args) > 0 {
		l.infoLog.Printf(msg, args...)
	} else {
		l.infoLog.Println(msg)
	}
}

func (l *StdLogger) Warn(msg string, args ...interface{}) {
	if len(args) > 0 {
		l.warnLog.Printf(msg, args...)
	} else {
		l.warnLog.Println(msg)
	}
}

func (l *StdLogger) Error(msg string, args ...interface{}) {
	if len(args) > 0 {
		l.errorLog.Printf(msg, args...)
	} else {
		l.errorLog.Println(msg)
	}
}

func (l *StdLogger) Debug(msg string, args ...interface{}) {
	if len(args) > 0 {
		l.debugLog.Printf(msg, args...)
	} else {
		l.debugLog.Println(msg)
	}
}
