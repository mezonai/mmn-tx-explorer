package log

import (
	"io"
	"os"
	"path/filepath"

	config "github.com/mezonai/mmn-tx-explorer/indexer/configs"
	"github.com/rs/zerolog"
	"github.com/rs/zerolog/log"
	"github.com/rs/zerolog/pkgerrors"
)

func InitLogger() {
	// overrides zerolog global logger
	log.Logger = NewLogger("indexer")
}

func NewLogger(name string) zerolog.Logger {
	zerolog.ErrorStackMarshaler = pkgerrors.MarshalStack

	level := zerolog.WarnLevel
	if lvl, err := zerolog.ParseLevel(config.Cfg.Log.Level); err == nil && lvl != zerolog.NoLevel {
		level = lvl
	}
	zerolog.SetGlobalLevel(level)

	// Create multi-writer for both console and file output
	var writers []io.Writer

	// Console output (always enabled)
	consoleWriter := os.Stderr
	if config.Cfg.Log.Prettify {
		writers = append(writers, zerolog.ConsoleWriter{Out: consoleWriter})
	} else {
		writers = append(writers, consoleWriter)
	}

	// File output (if enabled)
	if config.Cfg.Log.FileEnabled && config.Cfg.Log.FilePath != "" {
		// Ensure log directory exists
		logDir := filepath.Dir(config.Cfg.Log.FilePath)
		if err := os.MkdirAll(logDir, 0755); err != nil {
			log.Warn().Err(err).Msg("Failed to create log directory, falling back to console only")
		} else {
			// Create log file with rotation support
			fileWriter, err := createFileWriter(config.Cfg.Log)
			if err != nil {
				log.Warn().Err(err).Msg("Failed to create file writer, falling back to console only")
			} else {
				writers = append(writers, fileWriter)
			}
		}
	}

	// Create multi-writer
	var output io.Writer
	if len(writers) == 1 {
		output = writers[0]
	} else {
		output = zerolog.MultiLevelWriter(writers...)
	}

	logger := zerolog.New(output).With().Timestamp().Str("component", name).Logger()
	logger = logger.With().Caller().Logger()

	return logger
}

// createFileWriter creates a file writer with rotation support
func createFileWriter(logConfig config.LogConfig) (io.Writer, error) {
	// For now, we'll use a simple file writer
	// In production, you might want to use lumberjack for rotation
	file, err := os.OpenFile(logConfig.FilePath, os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0666)
	if err != nil {
		return nil, err
	}

	// Note: For production use, consider implementing log rotation
	// using a library like gopkg.in/natefinch/lumberjack.v2
	return file, nil
}
