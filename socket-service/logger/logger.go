package logger

import (
	"fmt"
	"io"
	"os"
	"path/filepath"
	"time"

	"github.com/rs/zerolog"
	"github.com/rs/zerolog/log"
	"gopkg.in/natefinch/lumberjack.v2"
)

const (
	LogOutputStdout = "stdout"
	LogOutputFile   = "file"
)

var Logger zerolog.Logger

// LogConfig represents logging configuration
type LogConfig struct {
	Level    string `mapstructure:"level"`     // debug, info, warn, error, fatal, panic
	Output   string `mapstructure:"output"`    // stdout, file
	FilePath string `mapstructure:"file_path"` // path to log file (when output=file)
	MaxSize  int    `mapstructure:"max_size"`  // max size in megabytes before rotation (default: 100MB)
	MaxAge   int    `mapstructure:"max_age"`   // max age in days to retain old log files (default: 30 days)
}

// InitLogger initializes the global logger with the provided configuration
func InitLogger(cfg *LogConfig) error {
	// Set log level
	level := parseLogLevel(cfg.Level)
	zerolog.SetGlobalLevel(level)

	// Configure time format
	zerolog.TimeFieldFormat = time.RFC3339

	var writer io.Writer

	// Default to stdout if not specified
	if cfg.Output == "" {
		cfg.Output = LogOutputStdout
	}

	switch cfg.Output {
	case LogOutputStdout:
		// Use console format for stdout
		writer = zerolog.ConsoleWriter{
			Out:        os.Stdout,
			TimeFormat: "2006-01-02 15:04:05",
		}
	case LogOutputFile:
		if cfg.FilePath == "" {
			return fmt.Errorf("file_path is required when output is 'file'")
		}
		// Create log directory if it doesn't exist
		logDir := filepath.Dir(cfg.FilePath)
		if err := os.MkdirAll(logDir, 0o755); err != nil {
			return fmt.Errorf("failed to create log directory: %w", err)
		}

		// Set default values for rotation
		maxSize := cfg.MaxSize
		if maxSize == 0 {
			maxSize = 100 // 100MB default
		}
		maxAge := cfg.MaxAge
		if maxAge == 0 {
			maxAge = 30 // 30 days default
		}

		// Use lumberjack for log rotation
		writer = &lumberjack.Logger{
			Filename:   cfg.FilePath,
			MaxSize:    maxSize, // megabytes
			MaxAge:     maxAge,  // days
			MaxBackups: 10,      // keep max 10 old log files
			Compress:   true,    // compress old log files
		}
	default:
		return fmt.Errorf("invalid output type: %s (must be 'stdout' or 'file')", cfg.Output)
	}

	// Initialize logger
	Logger = zerolog.New(writer).With().Timestamp().Caller().Logger()
	log.Logger = Logger

	Logger.Info().
		Str("level", cfg.Level).
		Str("output", cfg.Output).
		Msg("Logger initialized")

	return nil
}

// parseLogLevel converts string log level to zerolog.Level
func parseLogLevel(level string) zerolog.Level {
	switch level {
	case "debug":
		return zerolog.DebugLevel
	case "info":
		return zerolog.InfoLevel
	case "warn":
		return zerolog.WarnLevel
	case "error":
		return zerolog.ErrorLevel
	case "fatal":
		return zerolog.FatalLevel
	case "panic":
		return zerolog.PanicLevel
	default:
		return zerolog.InfoLevel
	}
}

// GetLogger returns the global logger instance
func GetLogger() *zerolog.Logger {
	return &Logger
}

// Debug logs a debug message
func Debug() *zerolog.Event {
	return Logger.Debug()
}

// Info logs an info message
func Info() *zerolog.Event {
	return Logger.Info()
}

// Warn logs a warning message
func Warn() *zerolog.Event {
	return Logger.Warn()
}

// Error logs an error message
func Error() *zerolog.Event {
	return Logger.Error()
}

// Fatal logs a fatal message and exits
func Fatal() *zerolog.Event {
	return Logger.Fatal()
}

// Panic logs a panic message and panics
func Panic() *zerolog.Event {
	return Logger.Panic()
}

// With creates a child logger with additional context
func With() zerolog.Context {
	return Logger.With()
}