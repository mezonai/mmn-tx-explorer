package types

import (
	"database/sql/driver"
	"fmt"
	"math/big"
)

type BigIntString struct {
	big.Int
}

// NewBigIntString creates a new BigIntString from an int64 value
func NewBigIntString(val int64) BigIntString {
	var b BigIntString
	b.SetInt64(val)
	return b
}

// NewBigIntStringFromBigInt creates a new BigIntString from a *big.Int value
func NewBigIntStringFromBigInt(val *big.Int) BigIntString {
	var b BigIntString
	if val != nil {
		b.Set(val)
	}
	return b
}

// MarshalJSON marshals BigIntString to JSON as a quoted string
func (b BigIntString) MarshalJSON() ([]byte, error) {
	return []byte(`"` + b.String() + `"`), nil
}

// UnmarshalJSON unmarshals a JSON string to BigIntString
func (b *BigIntString) UnmarshalJSON(data []byte) error {
	str := string(data)
	if len(str) >= 2 && str[0] == '"' && str[len(str)-1] == '"' {
		str = str[1 : len(str)-1]
	}
	_, ok := b.SetString(str, 10)
	if !ok {
		return fmt.Errorf("failed to parse BigIntString from: %s", string(data))
	}
	return nil
}

// Scan implements sql.Scanner for NUMERIC(78,0)
func (b *BigIntString) Scan(value interface{}) error {
	if value == nil {
		b.SetInt64(0)
		return nil
	}

	switch v := value.(type) {
	case []byte:
		if _, ok := b.SetString(string(v), 10); !ok {
			return fmt.Errorf("invalid BigIntString: %s", string(v))
		}
	case string:
		if _, ok := b.SetString(v, 10); !ok {
			return fmt.Errorf("invalid BigIntString: %s", v)
		}
	case int64:
		b.SetInt64(v)
	default:
		return fmt.Errorf("unsupported Scan type for BigIntString: %T", value)
	}
	return nil
}

// Value implements driver.Valuer interface for database writes
func (b BigIntString) Value() (driver.Value, error) {
	return b.String(), nil
}

func (b BigIntString) Multiply(multiplier BigIntString) BigIntString {
	var result BigIntString
	result.Mul(&b.Int, &multiplier.Int)
	return result
}

func (b *BigIntString) GetBigInt() *big.Int {
	return &b.Int
}

func (b BigIntString) Compare(o BigIntString) int {
	return b.Int.Cmp(&o.Int)
}
