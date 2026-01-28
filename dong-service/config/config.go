package config

import (
	"dong-service/logger"
	"fmt"
	"strings"
	"time"

	"github.com/spf13/viper"
)

// Config represents the application configuration
type Config struct {
	Server       ServerConfig       `mapstructure:"server"`
	Database     DatabaseConfig     `mapstructure:"database"`
	Indexer      IndexerConfig      `mapstructure:"indexer"`
	Blockchain   BlockchainConfig   `mapstructure:"blockchain"`
	CORS         CORSConfig         `mapstructure:"cors"`
	JWT          JWTConfig          `mapstructure:"jwt"`
	Oauth        OauthConfig        `mapstructure:"oauth"`
	Redis        RedisConfig        `mapstructure:"redis"`
	Logging      logger.LogConfig   `mapstructure:"logging"`
	Scheduler    SchedulerConfig    `mapstructure:"scheduler"`
	Lock         LockConfig         `mapstructure:"lock"`
	CacheRequest CacheRequestConfig `mapstructure:"cache_request"`
	RateLimit    RateLimitConfig    `mapstructure:"rate_limit"`
	FilterImage  FilterImageConfig  `mapstructure:"filter_image"`
	Event        EventConfig        `mapstructure:"event"`
	ZK           ZKConfig           `mapstructure:"zk"`
	Bridge       BridgeConfig       `mapstructure:"bridge"`
}

type ZKConfig struct {
	VerificationKeyPath string `mapstructure:"verification_key_path"`
}

type ServerConfig struct {
	Host    string `mapstructure:"host"`
	Port    string `mapstructure:"port"`
	GinMode string `mapstructure:"gin_mode"` // debug, release, test
}
type JWTConfig struct {
	Secret     string `mapstructure:"secret"`
	RefreshExp int    `mapstructure:"refresh_exp"`
	AccessExp  int    `mapstructure:"access_exp"`
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
	Host            string `mapstructure:"host"`
	Port            string `mapstructure:"port"`
	UserName        string `mapstructure:"username"`
	Password        string `mapstructure:"password"`
	Name            string `mapstructure:"name"`
	SSLMode         string `mapstructure:"sslmode"`
	MaxOpenConns    int    `mapstructure:"max_open_conns"`
	MaxIdleConns    int    `mapstructure:"max_idle_conns"`
	ConnMaxLifetime int    `mapstructure:"conn_max_lifetime"`  // in seconds
	ConnMaxIdleTime int    `mapstructure:"conn_max_idle_time"` // in seconds
	Schema          string `mapstructure:"schema"`
}

type CORSConfig struct {
	AllowOrigins string `mapstructure:"allow_origins"`
	AllowMethods string `mapstructure:"allow_methods"`
	AllowHeaders string `mapstructure:"allow_headers"`
	AllowCreds   bool   `mapstructure:"allow_credentials"`
}

type IndexerConfig struct {
	Schema string `mapstructure:"schema"`
}

type BlockchainConfig struct {
	RPCURL string `mapstructure:"rpc_url"`
	UseTLS bool   `mapstructure:"use_tls"`
}

type SchedulerConfig struct {
	SyncContributorsInterval    int `mapstructure:"sync_contributors_interval"`     // in seconds
	ExpiredRedEnvelopesInterval int `mapstructure:"expired_red_envelopes_interval"` // in seconds
	RecentStatsWindowDays       int `mapstructure:"recent_stats_window_days"`
	ExpiredOrdersInterval       int `mapstructure:"expired_orders_interval"` // in seconds
}

type LockConfig struct {
	LockExp    int `mapstructure:"lock_exp"` // in seconds
	CntRetry   int `mapstructure:"cnt_retry"`
	RetryDelay int `mapstructure:"retry_delay"` // in milliseconds
}

type CacheRequestConfig struct {
	CacheExp int `mapstructure:"cache_exp"` // in seconds
}

type RateLimitConfig struct {
	IPRateLimitPerSec int `mapstructure:"ip_rate_limit_per_sec"`
	IPRateLimitBurst  int `mapstructure:"ip_rate_limit_burst"`
}

type FilterImageConfig struct {
	MaxSizeUpload   int      `mapstructure:"max_size_upload"`
	EnableVirusScan bool     `mapstructure:"enable_virus_scan"`
	BlockMimeTypes  []string `mapstructure:"block_mime_types"`
	VirusScanURL    string   `mapstructure:"virus_scan_url"`
	IPFSURL         string   `mapstructure:"ipfs_url"`
}

type EventConfig struct {
	APIURL string `mapstructure:"api_url"`
	APIKey string `mapstructure:"api_key"`
}

type BridgeConfig struct {
	BSCWSURL              string        `mapstructure:"bsc_ws_url"`
	BSCRPCURL             string        `mapstructure:"bsc_rpc_url"`
	WMezonAddressContract string        `mapstructure:"wmezon_address_contract"`
	WMezonAddress         string        `mapstructure:"wmezon_address"`
	StartBlock            uint64        `mapstructure:"start_block"`
	PollingInterval       time.Duration `mapstructure:"polling_interval"`
	ConfirmationBlocks    uint64        `mapstructure:"confirmation_blocks"`
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
	return fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=%s search_path=%s",
		c.Host, c.Port, c.UserName, c.Password, c.Name, c.SSLMode, c.Schema)
}

func (c *DatabaseConfig) GetDSNWithoutSchema() string {
	return fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=%s",
		c.Host, c.Port, c.UserName, c.Password, c.Name, c.SSLMode)
}
