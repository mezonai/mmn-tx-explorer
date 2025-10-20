package config

import (
	"fmt"
	"strings"

	"github.com/rs/zerolog/log"
	"github.com/spf13/viper"
)

type LogConfig struct {
	Level    string `mapstructure:"level"`
	Prettify bool   `mapstructure:"prettify"`
	// File logging configuration
	FileEnabled bool   `mapstructure:"fileEnabled"`
	FilePath    string `mapstructure:"filePath"`
	MaxSize     int    `mapstructure:"maxSize"`    // Maximum size in MB before rotation
	MaxBackups  int    `mapstructure:"maxBackups"` // Maximum number of old log files to retain
	MaxAge      int    `mapstructure:"maxAge"`     // Maximum number of days to retain old log files
	Compress    bool   `mapstructure:"compress"`   // Whether to compress rotated log files
}

type PollerConfig struct {
	Enabled         bool `mapstructure:"enabled"`
	Interval        int  `mapstructure:"interval"`
	BlocksPerPoll   int  `mapstructure:"blocksPerPoll"`
	FromBlock       int  `mapstructure:"fromBlock"`
	ForceFromBlock  bool `mapstructure:"forceFromBlock"`
	UntilBlock      int  `mapstructure:"untilBlock"`
	ParallelPollers int  `mapstructure:"parallelPollers"`
}

type CommitterConfig struct {
	Enabled         bool `mapstructure:"enabled"`
	Interval        int  `mapstructure:"interval"`
	BlocksPerCommit int  `mapstructure:"blocksPerCommit"`
	FromBlock       int  `mapstructure:"fromBlock"`
}

type ReorgHandlerConfig struct {
	Enabled        bool `mapstructure:"enabled"`
	Interval       int  `mapstructure:"interval"`
	BlocksPerScan  int  `mapstructure:"blocksPerScan"`
	FromBlock      int  `mapstructure:"fromBlock"`
	ForceFromBlock bool `mapstructure:"forceFromBlock"`
}

type FailureRecovererConfig struct {
	Enabled      bool `mapstructure:"enabled"`
	Interval     int  `mapstructure:"interval"`
	BlocksPerRun int  `mapstructure:"blocksPerRun"`
}

type StorageConfig struct {
	Staging      StorageConnectionConfig `mapstructure:"staging"`
	Main         StorageConnectionConfig `mapstructure:"main"`
	Orchestrator StorageConnectionConfig `mapstructure:"orchestrator"`
	Dong         StorageConnectionConfig `mapstructure:"dong"`
}
type StorageType string

const (
	StorageTypeMain         StorageType = "main"
	StorageTypeStaging      StorageType = "staging"
	StorageTypeOrchestrator StorageType = "orchestrator"
	StorageTypeDong         StorageType = "dong"
)

type StorageConnectionConfig struct {
	Postgres *PostgresConfig `mapstructure:"postgres"`
}

type PostgresConfig struct {
	Host            string `mapstructure:"host"`
	Port            int    `mapstructure:"port"`
	Username        string `mapstructure:"username"`
	Password        string `mapstructure:"password"`
	Database        string `mapstructure:"database"`
	SSLMode         string `mapstructure:"sslMode"`
	MaxOpenConns    int    `mapstructure:"maxOpenConns"`
	MaxIdleConns    int    `mapstructure:"maxIdleConns"`
	MaxConnLifetime int    `mapstructure:"maxConnLifetime"`
	ConnectTimeout  int    `mapstructure:"connectTimeout"`
}

type RPCBatchRequestConfig struct {
	BlocksPerRequest   int `mapstructure:"blocksPerRequest"`
	BatchDelay         int `mapstructure:"batchDelay"`
	ConcurrentRequests int `mapstructure:"concurrentRequests"`
}

type ToggleableRPCBatchRequestConfig struct {
	Enabled bool `mapstructure:"enabled"`
	RPCBatchRequestConfig
}

type RPCConfig struct {
	URL           string                          `mapstructure:"url"`
	Blocks        RPCBatchRequestConfig           `mapstructure:"blocks"`
	Logs          RPCBatchRequestConfig           `mapstructure:"logs"`
	BlockReceipts ToggleableRPCBatchRequestConfig `mapstructure:"blockReceipts"`
	Traces        ToggleableRPCBatchRequestConfig `mapstructure:"traces"`
	ChainID       string                          `mapstructure:"chainId"`
	MMNGRPCURL    string                          `mapstructure:"mmnGrpcUrl"`
}

type BasicAuthConfig struct {
	Username string `mapstructure:"username"`
	Password string `mapstructure:"password"`
}

type ThirdwebConfig struct {
	ClientId string `mapstructure:"clientId"`
}

type ContractApiRequestConfig struct {
	MaxIdleConns        int  `mapstructure:"maxIdleConns"`
	MaxIdleConnsPerHost int  `mapstructure:"maxIdleConnsPerHost"`
	MaxConnsPerHost     int  `mapstructure:"maxConnsPerHost"`
	IdleConnTimeout     int  `mapstructure:"idleConnTimeout"`
	DisableCompression  bool `mapstructure:"disableCompression"`
	Timeout             int  `mapstructure:"timeout"`
}

type APIConfig struct {
	Host                string                   `mapstructure:"host"`
	BasicAuth           BasicAuthConfig          `mapstructure:"basicAuth"`
	ThirdwebContractApi string                   `mapstructure:"thirdwebContractApi"`
	ContractApiRequest  ContractApiRequestConfig `mapstructure:"contractApiRequest"`
	AbiDecodingEnabled  bool                     `mapstructure:"abiDecodingEnabled"`
	Thirdweb            ThirdwebConfig           `mapstructure:"thirdweb"`
}

type BlockPublisherConfig struct {
	Enabled   bool   `mapstructure:"enabled"`
	TopicName string `mapstructure:"topicName"`
}

type TransactionPublisherConfig struct {
	Enabled    bool     `mapstructure:"enabled"`
	TopicName  string   `mapstructure:"topicName"`
	ToFilter   []string `mapstructure:"toFilter"`
	FromFilter []string `mapstructure:"fromFilter"`
}

type TracePublisherConfig struct {
	Enabled   bool   `mapstructure:"enabled"`
	TopicName string `mapstructure:"topicName"`
}

type EventPublisherConfig struct {
	Enabled       bool     `mapstructure:"enabled"`
	TopicName     string   `mapstructure:"topicName"`
	AddressFilter []string `mapstructure:"addressFilter"`
	Topic0Filter  []string `mapstructure:"topic0Filter"`
}

type PublisherConfig struct {
	Enabled      bool                       `mapstructure:"enabled"`
	Mode         string                     `mapstructure:"mode"`
	Brokers      string                     `mapstructure:"brokers"`
	Username     string                     `mapstructure:"username"`
	Password     string                     `mapstructure:"password"`
	Blocks       BlockPublisherConfig       `mapstructure:"blocks"`
	Transactions TransactionPublisherConfig `mapstructure:"transactions"`
	Traces       TracePublisherConfig       `mapstructure:"traces"`
	Events       EventPublisherConfig       `mapstructure:"events"`
}

type WorkModeConfig struct {
	CheckIntervalMinutes int   `mapstructure:"checkIntervalMinutes"`
	LiveModeThreshold    int64 `mapstructure:"liveModeThreshold"`
}

type ValidationConfig struct {
	Mode string `mapstructure:"mode"` // "disabled", "minimal", "strict"
}

type Config struct {
	RPC              RPCConfig              `mapstructure:"rpc"`
	Log              LogConfig              `mapstructure:"log"`
	Poller           PollerConfig           `mapstructure:"poller"`
	Committer        CommitterConfig        `mapstructure:"committer"`
	FailureRecoverer FailureRecovererConfig `mapstructure:"failureRecoverer"`
	ReorgHandler     ReorgHandlerConfig     `mapstructure:"reorgHandler"`
	Storage          StorageConfig          `mapstructure:"storage"`
	API              APIConfig              `mapstructure:"api"`
	Publisher        PublisherConfig        `mapstructure:"publisher"`
	WorkMode         WorkModeConfig         `mapstructure:"workMode"`
	Validation       ValidationConfig       `mapstructure:"validation"`
}

var Cfg Config

func LoadConfig(cfgFile string) error {
	if cfgFile != "" {
		viper.SetConfigFile(cfgFile)
		if err := viper.ReadInConfig(); err != nil {
			return fmt.Errorf("error reading config file, %s", err)
		}
	} else {
		viper.SetConfigName("config")
		viper.AddConfigPath("/etc/mezon") // path for deploy
		viper.AddConfigPath("./configs")
		viper.AddConfigPath("/app/configs")

		if err := viper.ReadInConfig(); err != nil {
			log.Warn().Msgf("error reading config file, %s", err)
		}

		viper.SetConfigName("secrets")
		err := viper.MergeInConfig()
		if err != nil {
			log.Warn().Msgf("error loading secrets file: %v", err)
		}
	}

	// sets e.g. RPC_URL to rpc.url
	replacer := strings.NewReplacer(".", "_")
	viper.SetEnvKeyReplacer(replacer)

	viper.AutomaticEnv()

	err := viper.Unmarshal(&Cfg)
	if err != nil {
		return fmt.Errorf("error unmarshal config: %v", err)
	}

	return nil
}
