// Code generated - DO NOT EDIT.
// This file is a generated binding and any manual changes will be lost.

package contracts

import (
	"errors"
	"math/big"
	"strings"

	ethereum "github.com/ethereum/go-ethereum"
	"github.com/ethereum/go-ethereum/accounts/abi"
	"github.com/ethereum/go-ethereum/accounts/abi/bind"
	"github.com/ethereum/go-ethereum/common"
	"github.com/ethereum/go-ethereum/core/types"
	"github.com/ethereum/go-ethereum/event"
)

// Reference imports to suppress errors if they are not otherwise used.
var (
	_ = errors.New
	_ = big.NewInt
	_ = strings.NewReader
	_ = ethereum.NotFound
	_ = bind.Bind
	_ = common.Big1
	_ = types.BloomLookup
	_ = event.NewSubscription
	_ = abi.ConvertType
)

// WMEZONMetaData contains all meta data concerning the WMEZON contract.
var WMEZONMetaData = &bind.MetaData{
	ABI: "[{\"inputs\":[{\"internalType\":\"address\",\"name\":\"spender\",\"type\":\"address\"},{\"internalType\":\"uint256\",\"name\":\"value\",\"type\":\"uint256\"}],\"name\":\"approve\",\"outputs\":[{\"internalType\":\"bool\",\"name\":\"\",\"type\":\"bool\"}],\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"uint256\",\"name\":\"initSupply\",\"type\":\"uint256\"}],\"stateMutability\":\"nonpayable\",\"type\":\"constructor\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"spender\",\"type\":\"address\"},{\"internalType\":\"uint256\",\"name\":\"allowance\",\"type\":\"uint256\"},{\"internalType\":\"uint256\",\"name\":\"needed\",\"type\":\"uint256\"}],\"name\":\"ERC20InsufficientAllowance\",\"type\":\"error\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"sender\",\"type\":\"address\"},{\"internalType\":\"uint256\",\"name\":\"balance\",\"type\":\"uint256\"},{\"internalType\":\"uint256\",\"name\":\"needed\",\"type\":\"uint256\"}],\"name\":\"ERC20InsufficientBalance\",\"type\":\"error\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"approver\",\"type\":\"address\"}],\"name\":\"ERC20InvalidApprover\",\"type\":\"error\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"receiver\",\"type\":\"address\"}],\"name\":\"ERC20InvalidReceiver\",\"type\":\"error\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"sender\",\"type\":\"address\"}],\"name\":\"ERC20InvalidSender\",\"type\":\"error\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"spender\",\"type\":\"address\"}],\"name\":\"ERC20InvalidSpender\",\"type\":\"error\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"internalType\":\"address\",\"name\":\"owner\",\"type\":\"address\"},{\"indexed\":true,\"internalType\":\"address\",\"name\":\"spender\",\"type\":\"address\"},{\"indexed\":false,\"internalType\":\"uint256\",\"name\":\"value\",\"type\":\"uint256\"}],\"name\":\"Approval\",\"type\":\"event\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"to\",\"type\":\"address\"},{\"internalType\":\"uint256\",\"name\":\"value\",\"type\":\"uint256\"}],\"name\":\"transfer\",\"outputs\":[{\"internalType\":\"bool\",\"name\":\"\",\"type\":\"bool\"}],\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"internalType\":\"address\",\"name\":\"from\",\"type\":\"address\"},{\"indexed\":true,\"internalType\":\"address\",\"name\":\"to\",\"type\":\"address\"},{\"indexed\":false,\"internalType\":\"uint256\",\"name\":\"value\",\"type\":\"uint256\"}],\"name\":\"Transfer\",\"type\":\"event\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"from\",\"type\":\"address\"},{\"internalType\":\"address\",\"name\":\"to\",\"type\":\"address\"},{\"internalType\":\"uint256\",\"name\":\"value\",\"type\":\"uint256\"}],\"name\":\"transferFrom\",\"outputs\":[{\"internalType\":\"bool\",\"name\":\"\",\"type\":\"bool\"}],\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"internalType\":\"address\",\"name\":\"from\",\"type\":\"address\"},{\"indexed\":true,\"internalType\":\"address\",\"name\":\"to\",\"type\":\"address\"},{\"indexed\":false,\"internalType\":\"uint256\",\"name\":\"amount\",\"type\":\"uint256\"},{\"indexed\":false,\"internalType\":\"bytes\",\"name\":\"memo\",\"type\":\"bytes\"}],\"name\":\"TransferMemo\",\"type\":\"event\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"to\",\"type\":\"address\"},{\"internalType\":\"uint256\",\"name\":\"amount\",\"type\":\"uint256\"},{\"internalType\":\"bytes\",\"name\":\"memo\",\"type\":\"bytes\"}],\"name\":\"transferWithMemo\",\"outputs\":[{\"internalType\":\"bool\",\"name\":\"\",\"type\":\"bool\"}],\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"owner\",\"type\":\"address\"},{\"internalType\":\"address\",\"name\":\"spender\",\"type\":\"address\"}],\"name\":\"allowance\",\"outputs\":[{\"internalType\":\"uint256\",\"name\":\"\",\"type\":\"uint256\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"account\",\"type\":\"address\"}],\"name\":\"balanceOf\",\"outputs\":[{\"internalType\":\"uint256\",\"name\":\"\",\"type\":\"uint256\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[],\"name\":\"decimals\",\"outputs\":[{\"internalType\":\"uint8\",\"name\":\"\",\"type\":\"uint8\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[],\"name\":\"name\",\"outputs\":[{\"internalType\":\"string\",\"name\":\"\",\"type\":\"string\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[],\"name\":\"symbol\",\"outputs\":[{\"internalType\":\"string\",\"name\":\"\",\"type\":\"string\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[],\"name\":\"totalSupply\",\"outputs\":[{\"internalType\":\"uint256\",\"name\":\"\",\"type\":\"uint256\"}],\"stateMutability\":\"view\",\"type\":\"function\"}]",
}

// WMEZONABI is the input ABI used to generate the binding from.
// Deprecated: Use WMEZONMetaData.ABI instead.
var WMEZONABI = WMEZONMetaData.ABI

// WMEZON is an auto generated Go binding around an Ethereum contract.
type WMEZON struct {
	WMEZONCaller     // Read-only binding to the contract
	WMEZONTransactor // Write-only binding to the contract
	WMEZONFilterer   // Log filterer for contract events
}

// WMEZONCaller is an auto generated read-only Go binding around an Ethereum contract.
type WMEZONCaller struct {
	contract *bind.BoundContract // Generic contract wrapper for the low level calls
}

// WMEZONTransactor is an auto generated write-only Go binding around an Ethereum contract.
type WMEZONTransactor struct {
	contract *bind.BoundContract // Generic contract wrapper for the low level calls
}

// WMEZONFilterer is an auto generated log filtering Go binding around an Ethereum contract events.
type WMEZONFilterer struct {
	contract *bind.BoundContract // Generic contract wrapper for the low level calls
}

// WMEZONSession is an auto generated Go binding around an Ethereum contract,
// with pre-set call and transact options.
type WMEZONSession struct {
	Contract     *WMEZON           // Generic contract binding to set the session for
	CallOpts     bind.CallOpts     // Call options to use throughout this session
	TransactOpts bind.TransactOpts // Transaction auth options to use throughout this session
}

// WMEZONCallerSession is an auto generated read-only Go binding around an Ethereum contract,
// with pre-set call options.
type WMEZONCallerSession struct {
	Contract *WMEZONCaller // Generic contract caller binding to set the session for
	CallOpts bind.CallOpts // Call options to use throughout this session
}

// WMEZONTransactorSession is an auto generated write-only Go binding around an Ethereum contract,
// with pre-set transact options.
type WMEZONTransactorSession struct {
	Contract     *WMEZONTransactor // Generic contract transactor binding to set the session for
	TransactOpts bind.TransactOpts // Transaction auth options to use throughout this session
}

// WMEZONRaw is an auto generated low-level Go binding around an Ethereum contract.
type WMEZONRaw struct {
	Contract *WMEZON // Generic contract binding to access the raw methods on
}

// WMEZONCallerRaw is an auto generated low-level read-only Go binding around an Ethereum contract.
type WMEZONCallerRaw struct {
	Contract *WMEZONCaller // Generic read-only contract binding to access the raw methods on
}

// WMEZONTransactorRaw is an auto generated low-level write-only Go binding around an Ethereum contract.
type WMEZONTransactorRaw struct {
	Contract *WMEZONTransactor // Generic write-only contract binding to access the raw methods on
}

// NewWMEZON creates a new instance of WMEZON, bound to a specific deployed contract.
func NewWMEZON(address common.Address, backend bind.ContractBackend) (*WMEZON, error) {
	contract, err := bindWMEZON(address, backend, backend, backend)
	if err != nil {
		return nil, err
	}
	return &WMEZON{WMEZONCaller: WMEZONCaller{contract: contract}, WMEZONTransactor: WMEZONTransactor{contract: contract}, WMEZONFilterer: WMEZONFilterer{contract: contract}}, nil
}

// NewWMEZONCaller creates a new read-only instance of WMEZON, bound to a specific deployed contract.
func NewWMEZONCaller(address common.Address, caller bind.ContractCaller) (*WMEZONCaller, error) {
	contract, err := bindWMEZON(address, caller, nil, nil)
	if err != nil {
		return nil, err
	}
	return &WMEZONCaller{contract: contract}, nil
}

// NewWMEZONTransactor creates a new write-only instance of WMEZON, bound to a specific deployed contract.
func NewWMEZONTransactor(address common.Address, transactor bind.ContractTransactor) (*WMEZONTransactor, error) {
	contract, err := bindWMEZON(address, nil, transactor, nil)
	if err != nil {
		return nil, err
	}
	return &WMEZONTransactor{contract: contract}, nil
}

// NewWMEZONFilterer creates a new log filterer instance of WMEZON, bound to a specific deployed contract.
func NewWMEZONFilterer(address common.Address, filterer bind.ContractFilterer) (*WMEZONFilterer, error) {
	contract, err := bindWMEZON(address, nil, nil, filterer)
	if err != nil {
		return nil, err
	}
	return &WMEZONFilterer{contract: contract}, nil
}

// bindWMEZON binds a generic wrapper to an already deployed contract.
func bindWMEZON(address common.Address, caller bind.ContractCaller, transactor bind.ContractTransactor, filterer bind.ContractFilterer) (*bind.BoundContract, error) {
	parsed, err := WMEZONMetaData.GetAbi()
	if err != nil {
		return nil, err
	}
	return bind.NewBoundContract(address, *parsed, caller, transactor, filterer), nil
}

// Call invokes the (constant) contract method with params as input values and
// sets the output to result. The result type might be a single field for simple
// returns, a slice of interfaces for anonymous returns and a struct for named
// returns.
func (_WMEZON *WMEZONRaw) Call(opts *bind.CallOpts, result *[]interface{}, method string, params ...interface{}) error {
	return _WMEZON.Contract.WMEZONCaller.contract.Call(opts, result, method, params...)
}

// Transfer initiates a plain transaction to move funds to the contract, calling
// its default method if one is available.
func (_WMEZON *WMEZONRaw) Transfer(opts *bind.TransactOpts) (*types.Transaction, error) {
	return _WMEZON.Contract.WMEZONTransactor.contract.Transfer(opts)
}

// Transact invokes the (paid) contract method with params as input values.
func (_WMEZON *WMEZONRaw) Transact(opts *bind.TransactOpts, method string, params ...interface{}) (*types.Transaction, error) {
	return _WMEZON.Contract.WMEZONTransactor.contract.Transact(opts, method, params...)
}

// Call invokes the (constant) contract method with params as input values and
// sets the output to result. The result type might be a single field for simple
// returns, a slice of interfaces for anonymous returns and a struct for named
// returns.
func (_WMEZON *WMEZONCallerRaw) Call(opts *bind.CallOpts, result *[]interface{}, method string, params ...interface{}) error {
	return _WMEZON.Contract.contract.Call(opts, result, method, params...)
}

// Transfer initiates a plain transaction to move funds to the contract, calling
// its default method if one is available.
func (_WMEZON *WMEZONTransactorRaw) Transfer(opts *bind.TransactOpts) (*types.Transaction, error) {
	return _WMEZON.Contract.contract.Transfer(opts)
}

// Transact invokes the (paid) contract method with params as input values.
func (_WMEZON *WMEZONTransactorRaw) Transact(opts *bind.TransactOpts, method string, params ...interface{}) (*types.Transaction, error) {
	return _WMEZON.Contract.contract.Transact(opts, method, params...)
}

// Allowance is a free data retrieval call binding the contract method 0xdd62ed3e.
//
// Solidity: function allowance(address owner, address spender) view returns(uint256)
func (_WMEZON *WMEZONCaller) Allowance(opts *bind.CallOpts, owner common.Address, spender common.Address) (*big.Int, error) {
	var out []interface{}
	err := _WMEZON.contract.Call(opts, &out, "allowance", owner, spender)

	if err != nil {
		return *new(*big.Int), err
	}

	out0 := *abi.ConvertType(out[0], new(*big.Int)).(**big.Int)

	return out0, err

}

// Allowance is a free data retrieval call binding the contract method 0xdd62ed3e.
//
// Solidity: function allowance(address owner, address spender) view returns(uint256)
func (_WMEZON *WMEZONSession) Allowance(owner common.Address, spender common.Address) (*big.Int, error) {
	return _WMEZON.Contract.Allowance(&_WMEZON.CallOpts, owner, spender)
}

// Allowance is a free data retrieval call binding the contract method 0xdd62ed3e.
//
// Solidity: function allowance(address owner, address spender) view returns(uint256)
func (_WMEZON *WMEZONCallerSession) Allowance(owner common.Address, spender common.Address) (*big.Int, error) {
	return _WMEZON.Contract.Allowance(&_WMEZON.CallOpts, owner, spender)
}

// BalanceOf is a free data retrieval call binding the contract method 0x70a08231.
//
// Solidity: function balanceOf(address account) view returns(uint256)
func (_WMEZON *WMEZONCaller) BalanceOf(opts *bind.CallOpts, account common.Address) (*big.Int, error) {
	var out []interface{}
	err := _WMEZON.contract.Call(opts, &out, "balanceOf", account)

	if err != nil {
		return *new(*big.Int), err
	}

	out0 := *abi.ConvertType(out[0], new(*big.Int)).(**big.Int)

	return out0, err

}

// BalanceOf is a free data retrieval call binding the contract method 0x70a08231.
//
// Solidity: function balanceOf(address account) view returns(uint256)
func (_WMEZON *WMEZONSession) BalanceOf(account common.Address) (*big.Int, error) {
	return _WMEZON.Contract.BalanceOf(&_WMEZON.CallOpts, account)
}

// BalanceOf is a free data retrieval call binding the contract method 0x70a08231.
//
// Solidity: function balanceOf(address account) view returns(uint256)
func (_WMEZON *WMEZONCallerSession) BalanceOf(account common.Address) (*big.Int, error) {
	return _WMEZON.Contract.BalanceOf(&_WMEZON.CallOpts, account)
}

// Decimals is a free data retrieval call binding the contract method 0x313ce567.
//
// Solidity: function decimals() view returns(uint8)
func (_WMEZON *WMEZONCaller) Decimals(opts *bind.CallOpts) (uint8, error) {
	var out []interface{}
	err := _WMEZON.contract.Call(opts, &out, "decimals")

	if err != nil {
		return *new(uint8), err
	}

	out0 := *abi.ConvertType(out[0], new(uint8)).(*uint8)

	return out0, err

}

// Decimals is a free data retrieval call binding the contract method 0x313ce567.
//
// Solidity: function decimals() view returns(uint8)
func (_WMEZON *WMEZONSession) Decimals() (uint8, error) {
	return _WMEZON.Contract.Decimals(&_WMEZON.CallOpts)
}

// Decimals is a free data retrieval call binding the contract method 0x313ce567.
//
// Solidity: function decimals() view returns(uint8)
func (_WMEZON *WMEZONCallerSession) Decimals() (uint8, error) {
	return _WMEZON.Contract.Decimals(&_WMEZON.CallOpts)
}

// Name is a free data retrieval call binding the contract method 0x06fdde03.
//
// Solidity: function name() view returns(string)
func (_WMEZON *WMEZONCaller) Name(opts *bind.CallOpts) (string, error) {
	var out []interface{}
	err := _WMEZON.contract.Call(opts, &out, "name")

	if err != nil {
		return *new(string), err
	}

	out0 := *abi.ConvertType(out[0], new(string)).(*string)

	return out0, err

}

// Name is a free data retrieval call binding the contract method 0x06fdde03.
//
// Solidity: function name() view returns(string)
func (_WMEZON *WMEZONSession) Name() (string, error) {
	return _WMEZON.Contract.Name(&_WMEZON.CallOpts)
}

// Name is a free data retrieval call binding the contract method 0x06fdde03.
//
// Solidity: function name() view returns(string)
func (_WMEZON *WMEZONCallerSession) Name() (string, error) {
	return _WMEZON.Contract.Name(&_WMEZON.CallOpts)
}

// Symbol is a free data retrieval call binding the contract method 0x95d89b41.
//
// Solidity: function symbol() view returns(string)
func (_WMEZON *WMEZONCaller) Symbol(opts *bind.CallOpts) (string, error) {
	var out []interface{}
	err := _WMEZON.contract.Call(opts, &out, "symbol")

	if err != nil {
		return *new(string), err
	}

	out0 := *abi.ConvertType(out[0], new(string)).(*string)

	return out0, err

}

// Symbol is a free data retrieval call binding the contract method 0x95d89b41.
//
// Solidity: function symbol() view returns(string)
func (_WMEZON *WMEZONSession) Symbol() (string, error) {
	return _WMEZON.Contract.Symbol(&_WMEZON.CallOpts)
}

// Symbol is a free data retrieval call binding the contract method 0x95d89b41.
//
// Solidity: function symbol() view returns(string)
func (_WMEZON *WMEZONCallerSession) Symbol() (string, error) {
	return _WMEZON.Contract.Symbol(&_WMEZON.CallOpts)
}

// TotalSupply is a free data retrieval call binding the contract method 0x18160ddd.
//
// Solidity: function totalSupply() view returns(uint256)
func (_WMEZON *WMEZONCaller) TotalSupply(opts *bind.CallOpts) (*big.Int, error) {
	var out []interface{}
	err := _WMEZON.contract.Call(opts, &out, "totalSupply")

	if err != nil {
		return *new(*big.Int), err
	}

	out0 := *abi.ConvertType(out[0], new(*big.Int)).(**big.Int)

	return out0, err

}

// TotalSupply is a free data retrieval call binding the contract method 0x18160ddd.
//
// Solidity: function totalSupply() view returns(uint256)
func (_WMEZON *WMEZONSession) TotalSupply() (*big.Int, error) {
	return _WMEZON.Contract.TotalSupply(&_WMEZON.CallOpts)
}

// TotalSupply is a free data retrieval call binding the contract method 0x18160ddd.
//
// Solidity: function totalSupply() view returns(uint256)
func (_WMEZON *WMEZONCallerSession) TotalSupply() (*big.Int, error) {
	return _WMEZON.Contract.TotalSupply(&_WMEZON.CallOpts)
}

// Approve is a paid mutator transaction binding the contract method 0x095ea7b3.
//
// Solidity: function approve(address spender, uint256 value) returns(bool)
func (_WMEZON *WMEZONTransactor) Approve(opts *bind.TransactOpts, spender common.Address, value *big.Int) (*types.Transaction, error) {
	return _WMEZON.contract.Transact(opts, "approve", spender, value)
}

// Approve is a paid mutator transaction binding the contract method 0x095ea7b3.
//
// Solidity: function approve(address spender, uint256 value) returns(bool)
func (_WMEZON *WMEZONSession) Approve(spender common.Address, value *big.Int) (*types.Transaction, error) {
	return _WMEZON.Contract.Approve(&_WMEZON.TransactOpts, spender, value)
}

// Approve is a paid mutator transaction binding the contract method 0x095ea7b3.
//
// Solidity: function approve(address spender, uint256 value) returns(bool)
func (_WMEZON *WMEZONTransactorSession) Approve(spender common.Address, value *big.Int) (*types.Transaction, error) {
	return _WMEZON.Contract.Approve(&_WMEZON.TransactOpts, spender, value)
}

// Transfer is a paid mutator transaction binding the contract method 0xa9059cbb.
//
// Solidity: function transfer(address to, uint256 value) returns(bool)
func (_WMEZON *WMEZONTransactor) Transfer(opts *bind.TransactOpts, to common.Address, value *big.Int) (*types.Transaction, error) {
	return _WMEZON.contract.Transact(opts, "transfer", to, value)
}

// Transfer is a paid mutator transaction binding the contract method 0xa9059cbb.
//
// Solidity: function transfer(address to, uint256 value) returns(bool)
func (_WMEZON *WMEZONSession) Transfer(to common.Address, value *big.Int) (*types.Transaction, error) {
	return _WMEZON.Contract.Transfer(&_WMEZON.TransactOpts, to, value)
}

// Transfer is a paid mutator transaction binding the contract method 0xa9059cbb.
//
// Solidity: function transfer(address to, uint256 value) returns(bool)
func (_WMEZON *WMEZONTransactorSession) Transfer(to common.Address, value *big.Int) (*types.Transaction, error) {
	return _WMEZON.Contract.Transfer(&_WMEZON.TransactOpts, to, value)
}

// TransferFrom is a paid mutator transaction binding the contract method 0x23b872dd.
//
// Solidity: function transferFrom(address from, address to, uint256 value) returns(bool)
func (_WMEZON *WMEZONTransactor) TransferFrom(opts *bind.TransactOpts, from common.Address, to common.Address, value *big.Int) (*types.Transaction, error) {
	return _WMEZON.contract.Transact(opts, "transferFrom", from, to, value)
}

// TransferFrom is a paid mutator transaction binding the contract method 0x23b872dd.
//
// Solidity: function transferFrom(address from, address to, uint256 value) returns(bool)
func (_WMEZON *WMEZONSession) TransferFrom(from common.Address, to common.Address, value *big.Int) (*types.Transaction, error) {
	return _WMEZON.Contract.TransferFrom(&_WMEZON.TransactOpts, from, to, value)
}

// TransferFrom is a paid mutator transaction binding the contract method 0x23b872dd.
//
// Solidity: function transferFrom(address from, address to, uint256 value) returns(bool)
func (_WMEZON *WMEZONTransactorSession) TransferFrom(from common.Address, to common.Address, value *big.Int) (*types.Transaction, error) {
	return _WMEZON.Contract.TransferFrom(&_WMEZON.TransactOpts, from, to, value)
}

// TransferWithMemo is a paid mutator transaction binding the contract method 0xef5ff4d2.
//
// Solidity: function transferWithMemo(address to, uint256 amount, bytes memo) returns(bool)
func (_WMEZON *WMEZONTransactor) TransferWithMemo(opts *bind.TransactOpts, to common.Address, amount *big.Int, memo []byte) (*types.Transaction, error) {
	return _WMEZON.contract.Transact(opts, "transferWithMemo", to, amount, memo)
}

// TransferWithMemo is a paid mutator transaction binding the contract method 0xef5ff4d2.
//
// Solidity: function transferWithMemo(address to, uint256 amount, bytes memo) returns(bool)
func (_WMEZON *WMEZONSession) TransferWithMemo(to common.Address, amount *big.Int, memo []byte) (*types.Transaction, error) {
	return _WMEZON.Contract.TransferWithMemo(&_WMEZON.TransactOpts, to, amount, memo)
}

// TransferWithMemo is a paid mutator transaction binding the contract method 0xef5ff4d2.
//
// Solidity: function transferWithMemo(address to, uint256 amount, bytes memo) returns(bool)
func (_WMEZON *WMEZONTransactorSession) TransferWithMemo(to common.Address, amount *big.Int, memo []byte) (*types.Transaction, error) {
	return _WMEZON.Contract.TransferWithMemo(&_WMEZON.TransactOpts, to, amount, memo)
}

// WMEZONApprovalIterator is returned from FilterApproval and is used to iterate over the raw logs and unpacked data for Approval events raised by the WMEZON contract.
type WMEZONApprovalIterator struct {
	Event *WMEZONApproval // Event containing the contract specifics and raw log

	contract *bind.BoundContract // Generic contract to use for unpacking event data
	event    string              // Event name to use for unpacking event data

	logs chan types.Log        // Log channel receiving the found contract events
	sub  ethereum.Subscription // Subscription for errors, completion and termination
	done bool                  // Whether the subscription completed delivering logs
	fail error                 // Occurred error to stop iteration
}

// Next advances the iterator to the subsequent event, returning whether there
// are any more events found. In case of a retrieval or parsing error, false is
// returned and Error() can be queried for the exact failure.
func (it *WMEZONApprovalIterator) Next() bool {
	// If the iterator failed, stop iterating
	if it.fail != nil {
		return false
	}
	// If the iterator completed, deliver directly whatever's available
	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(WMEZONApproval)
			if err := it.contract.UnpackLog(it.Event, it.event, log); err != nil {
				it.fail = err
				return false
			}
			it.Event.Raw = log
			return true

		default:
			return false
		}
	}
	// Iterator still in progress, wait for either a data or an error event
	select {
	case log := <-it.logs:
		it.Event = new(WMEZONApproval)
		if err := it.contract.UnpackLog(it.Event, it.event, log); err != nil {
			it.fail = err
			return false
		}
		it.Event.Raw = log
		return true

	case err := <-it.sub.Err():
		it.done = true
		it.fail = err
		return it.Next()
	}
}

// Error returns any retrieval or parsing error occurred during filtering.
func (it *WMEZONApprovalIterator) Error() error {
	return it.fail
}

// Close terminates the iteration process, releasing any pending underlying
// resources.
func (it *WMEZONApprovalIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

// WMEZONApproval represents a Approval event raised by the WMEZON contract.
type WMEZONApproval struct {
	Owner   common.Address
	Spender common.Address
	Value   *big.Int
	Raw     types.Log // Blockchain specific contextual infos
}

// FilterApproval is a free log retrieval operation binding the contract event 0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925.
//
// Solidity: event Approval(address indexed owner, address indexed spender, uint256 value)
func (_WMEZON *WMEZONFilterer) FilterApproval(opts *bind.FilterOpts, owner []common.Address, spender []common.Address) (*WMEZONApprovalIterator, error) {

	var ownerRule []interface{}
	for _, ownerItem := range owner {
		ownerRule = append(ownerRule, ownerItem)
	}
	var spenderRule []interface{}
	for _, spenderItem := range spender {
		spenderRule = append(spenderRule, spenderItem)
	}

	logs, sub, err := _WMEZON.contract.FilterLogs(opts, "Approval", ownerRule, spenderRule)
	if err != nil {
		return nil, err
	}
	return &WMEZONApprovalIterator{contract: _WMEZON.contract, event: "Approval", logs: logs, sub: sub}, nil
}

// WatchApproval is a free log subscription operation binding the contract event 0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925.
//
// Solidity: event Approval(address indexed owner, address indexed spender, uint256 value)
func (_WMEZON *WMEZONFilterer) WatchApproval(opts *bind.WatchOpts, sink chan<- *WMEZONApproval, owner []common.Address, spender []common.Address) (event.Subscription, error) {

	var ownerRule []interface{}
	for _, ownerItem := range owner {
		ownerRule = append(ownerRule, ownerItem)
	}
	var spenderRule []interface{}
	for _, spenderItem := range spender {
		spenderRule = append(spenderRule, spenderItem)
	}

	logs, sub, err := _WMEZON.contract.WatchLogs(opts, "Approval", ownerRule, spenderRule)
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:
				// New log arrived, parse the event and forward to the user
				event := new(WMEZONApproval)
				if err := _WMEZON.contract.UnpackLog(event, "Approval", log); err != nil {
					return err
				}
				event.Raw = log

				select {
				case sink <- event:
				case err := <-sub.Err():
					return err
				case <-quit:
					return nil
				}
			case err := <-sub.Err():
				return err
			case <-quit:
				return nil
			}
		}
	}), nil
}

// ParseApproval is a log parse operation binding the contract event 0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925.
//
// Solidity: event Approval(address indexed owner, address indexed spender, uint256 value)
func (_WMEZON *WMEZONFilterer) ParseApproval(log types.Log) (*WMEZONApproval, error) {
	event := new(WMEZONApproval)
	if err := _WMEZON.contract.UnpackLog(event, "Approval", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

// WMEZONTransferIterator is returned from FilterTransfer and is used to iterate over the raw logs and unpacked data for Transfer events raised by the WMEZON contract.
type WMEZONTransferIterator struct {
	Event *WMEZONTransfer // Event containing the contract specifics and raw log

	contract *bind.BoundContract // Generic contract to use for unpacking event data
	event    string              // Event name to use for unpacking event data

	logs chan types.Log        // Log channel receiving the found contract events
	sub  ethereum.Subscription // Subscription for errors, completion and termination
	done bool                  // Whether the subscription completed delivering logs
	fail error                 // Occurred error to stop iteration
}

// Next advances the iterator to the subsequent event, returning whether there
// are any more events found. In case of a retrieval or parsing error, false is
// returned and Error() can be queried for the exact failure.
func (it *WMEZONTransferIterator) Next() bool {
	// If the iterator failed, stop iterating
	if it.fail != nil {
		return false
	}
	// If the iterator completed, deliver directly whatever's available
	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(WMEZONTransfer)
			if err := it.contract.UnpackLog(it.Event, it.event, log); err != nil {
				it.fail = err
				return false
			}
			it.Event.Raw = log
			return true

		default:
			return false
		}
	}
	// Iterator still in progress, wait for either a data or an error event
	select {
	case log := <-it.logs:
		it.Event = new(WMEZONTransfer)
		if err := it.contract.UnpackLog(it.Event, it.event, log); err != nil {
			it.fail = err
			return false
		}
		it.Event.Raw = log
		return true

	case err := <-it.sub.Err():
		it.done = true
		it.fail = err
		return it.Next()
	}
}

// Error returns any retrieval or parsing error occurred during filtering.
func (it *WMEZONTransferIterator) Error() error {
	return it.fail
}

// Close terminates the iteration process, releasing any pending underlying
// resources.
func (it *WMEZONTransferIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

// WMEZONTransfer represents a Transfer event raised by the WMEZON contract.
type WMEZONTransfer struct {
	From  common.Address
	To    common.Address
	Value *big.Int
	Raw   types.Log // Blockchain specific contextual infos
}

// FilterTransfer is a free log retrieval operation binding the contract event 0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef.
//
// Solidity: event Transfer(address indexed from, address indexed to, uint256 value)
func (_WMEZON *WMEZONFilterer) FilterTransfer(opts *bind.FilterOpts, from []common.Address, to []common.Address) (*WMEZONTransferIterator, error) {

	var fromRule []interface{}
	for _, fromItem := range from {
		fromRule = append(fromRule, fromItem)
	}
	var toRule []interface{}
	for _, toItem := range to {
		toRule = append(toRule, toItem)
	}

	logs, sub, err := _WMEZON.contract.FilterLogs(opts, "Transfer", fromRule, toRule)
	if err != nil {
		return nil, err
	}
	return &WMEZONTransferIterator{contract: _WMEZON.contract, event: "Transfer", logs: logs, sub: sub}, nil
}

// WatchTransfer is a free log subscription operation binding the contract event 0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef.
//
// Solidity: event Transfer(address indexed from, address indexed to, uint256 value)
func (_WMEZON *WMEZONFilterer) WatchTransfer(opts *bind.WatchOpts, sink chan<- *WMEZONTransfer, from []common.Address, to []common.Address) (event.Subscription, error) {

	var fromRule []interface{}
	for _, fromItem := range from {
		fromRule = append(fromRule, fromItem)
	}
	var toRule []interface{}
	for _, toItem := range to {
		toRule = append(toRule, toItem)
	}

	logs, sub, err := _WMEZON.contract.WatchLogs(opts, "Transfer", fromRule, toRule)
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:
				// New log arrived, parse the event and forward to the user
				event := new(WMEZONTransfer)
				if err := _WMEZON.contract.UnpackLog(event, "Transfer", log); err != nil {
					return err
				}
				event.Raw = log

				select {
				case sink <- event:
				case err := <-sub.Err():
					return err
				case <-quit:
					return nil
				}
			case err := <-sub.Err():
				return err
			case <-quit:
				return nil
			}
		}
	}), nil
}

// ParseTransfer is a log parse operation binding the contract event 0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef.
//
// Solidity: event Transfer(address indexed from, address indexed to, uint256 value)
func (_WMEZON *WMEZONFilterer) ParseTransfer(log types.Log) (*WMEZONTransfer, error) {
	event := new(WMEZONTransfer)
	if err := _WMEZON.contract.UnpackLog(event, "Transfer", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

// WMEZONTransferMemoIterator is returned from FilterTransferMemo and is used to iterate over the raw logs and unpacked data for TransferMemo events raised by the WMEZON contract.
type WMEZONTransferMemoIterator struct {
	Event *WMEZONTransferMemo // Event containing the contract specifics and raw log

	contract *bind.BoundContract // Generic contract to use for unpacking event data
	event    string              // Event name to use for unpacking event data

	logs chan types.Log        // Log channel receiving the found contract events
	sub  ethereum.Subscription // Subscription for errors, completion and termination
	done bool                  // Whether the subscription completed delivering logs
	fail error                 // Occurred error to stop iteration
}

// Next advances the iterator to the subsequent event, returning whether there
// are any more events found. In case of a retrieval or parsing error, false is
// returned and Error() can be queried for the exact failure.
func (it *WMEZONTransferMemoIterator) Next() bool {
	// If the iterator failed, stop iterating
	if it.fail != nil {
		return false
	}
	// If the iterator completed, deliver directly whatever's available
	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(WMEZONTransferMemo)
			if err := it.contract.UnpackLog(it.Event, it.event, log); err != nil {
				it.fail = err
				return false
			}
			it.Event.Raw = log
			return true

		default:
			return false
		}
	}
	// Iterator still in progress, wait for either a data or an error event
	select {
	case log := <-it.logs:
		it.Event = new(WMEZONTransferMemo)
		if err := it.contract.UnpackLog(it.Event, it.event, log); err != nil {
			it.fail = err
			return false
		}
		it.Event.Raw = log
		return true

	case err := <-it.sub.Err():
		it.done = true
		it.fail = err
		return it.Next()
	}
}

// Error returns any retrieval or parsing error occurred during filtering.
func (it *WMEZONTransferMemoIterator) Error() error {
	return it.fail
}

// Close terminates the iteration process, releasing any pending underlying
// resources.
func (it *WMEZONTransferMemoIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

// WMEZONTransferMemo represents a TransferMemo event raised by the WMEZON contract.
type WMEZONTransferMemo struct {
	From   common.Address
	To     common.Address
	Amount *big.Int
	Memo   []byte
	Raw    types.Log // Blockchain specific contextual infos
}

// FilterTransferMemo is a free log retrieval operation binding the contract event 0x21de3ad89e9fa1e37bf684b537343eb04657fea1c311be92b5f1f8547bb0622b.
//
// Solidity: event TransferMemo(address indexed from, address indexed to, uint256 amount, bytes memo)
func (_WMEZON *WMEZONFilterer) FilterTransferMemo(opts *bind.FilterOpts, from []common.Address, to []common.Address) (*WMEZONTransferMemoIterator, error) {

	var fromRule []interface{}
	for _, fromItem := range from {
		fromRule = append(fromRule, fromItem)
	}
	var toRule []interface{}
	for _, toItem := range to {
		toRule = append(toRule, toItem)
	}

	logs, sub, err := _WMEZON.contract.FilterLogs(opts, "TransferMemo", fromRule, toRule)
	if err != nil {
		return nil, err
	}
	return &WMEZONTransferMemoIterator{contract: _WMEZON.contract, event: "TransferMemo", logs: logs, sub: sub}, nil
}

// WatchTransferMemo is a free log subscription operation binding the contract event 0x21de3ad89e9fa1e37bf684b537343eb04657fea1c311be92b5f1f8547bb0622b.
//
// Solidity: event TransferMemo(address indexed from, address indexed to, uint256 amount, bytes memo)
func (_WMEZON *WMEZONFilterer) WatchTransferMemo(opts *bind.WatchOpts, sink chan<- *WMEZONTransferMemo, from []common.Address, to []common.Address) (event.Subscription, error) {

	var fromRule []interface{}
	for _, fromItem := range from {
		fromRule = append(fromRule, fromItem)
	}
	var toRule []interface{}
	for _, toItem := range to {
		toRule = append(toRule, toItem)
	}

	logs, sub, err := _WMEZON.contract.WatchLogs(opts, "TransferMemo", fromRule, toRule)
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:
				// New log arrived, parse the event and forward to the user
				event := new(WMEZONTransferMemo)
				if err := _WMEZON.contract.UnpackLog(event, "TransferMemo", log); err != nil {
					return err
				}
				event.Raw = log

				select {
				case sink <- event:
				case err := <-sub.Err():
					return err
				case <-quit:
					return nil
				}
			case err := <-sub.Err():
				return err
			case <-quit:
				return nil
			}
		}
	}), nil
}

// ParseTransferMemo is a log parse operation binding the contract event 0x21de3ad89e9fa1e37bf684b537343eb04657fea1c311be92b5f1f8547bb0622b.
//
// Solidity: event TransferMemo(address indexed from, address indexed to, uint256 amount, bytes memo)
func (_WMEZON *WMEZONFilterer) ParseTransferMemo(log types.Log) (*WMEZONTransferMemo, error) {
	event := new(WMEZONTransferMemo)
	if err := _WMEZON.contract.UnpackLog(event, "TransferMemo", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}
