package config

import (
	"fmt"
	"strings"

	"github.com/spf13/viper"
)
var Cfg *Config
type Config struct {
	Server   ServerConfig   `mapstructure:"server"`
	Database DatabaseConfig `mapstructure:"database"`
	CORS     CORSConfig     `mapstructure:"cors"`
	JWT      JWTConfig      `mapstructure:"jwt"`
	Oauth    OauthConfig    `mapstructure:"oauth"`
	Redis    RedisConfig    `mapstructure:"redis"`
}

type ServerConfig struct {
	Host    string `mapstructure:"host"`
	Port    string `mapstructure:"port"`
	GinMode string `mapstructure:"gin_mode"` // debug, release, test
}
type JWTConfig struct {
	Secret      string `mapstructure:"secret"`
	Refresh_Exp int    `mapstructure:"refresh_exp"`
	Access_Exp  int    `mapstructure:"access_exp"`
}

type RedisConfig struct {
	Address  string `mapstructure:"address"`
	Password string `mapstructure:"password"`
	DB       int    `mapstructure:"db"`
}

type OauthConfig struct {
	ClientID     string `mapstructure:"client_id"`
	ClientSecret string `mapstructure:"client_secret"`
	TokenURL     string `mapstructure:"token_url"`
	UserInfoURL  string `mapstructure:"user_info_url"`
}
type DatabaseConfig struct {
	Host         string `mapstructure:"host"`
	Port         string `mapstructure:"port"`
	User         string `mapstructure:"user"`
	Password     string `mapstructure:"password"`
	DBName       string `mapstructure:"name"`
	SSLMode      string `mapstructure:"sslmode"`
	MaxOpenConns int    `mapstructure:"max_open_conns"`
	MaxIdleConns int    `mapstructure:"max_idle_conns"`
}

type CORSConfig struct {
	AllowOrigins string `mapstructure:"allow_origins"`
	AllowMethods string `mapstructure:"allow_methods"`
	AllowHeaders string `mapstructure:"allow_headers"`
	AllowCreds   bool   `mapstructure:"allow_credentials"`
}

func LoadConfig(cfgFile string) (*Config, error) {
	// Use specific config file if provided
	viper.SetConfigFile(cfgFile)

	// Read config file
	if err := viper.ReadInConfig(); err != nil {
		return nil, fmt.Errorf("error reading config file: %w", err)
	}

	// Allow environment variables to override config file
	// Environment variables should use format: SERVER_HOST, DATABASE_PORT, etc.
	viper.SetEnvKeyReplacer(strings.NewReplacer(".", "_"))
	viper.AutomaticEnv()

	// Unmarshal config into struct
	var config Config
	if err := viper.Unmarshal(&config); err != nil {
		return nil, fmt.Errorf("error unmarshaling config: %w", err)
	}

	return &config, nil
}

func (c *DatabaseConfig) GetDSN() string {
	return fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=%s",
		c.Host, c.Port, c.User, c.Password, c.DBName, c.SSLMode)
}
