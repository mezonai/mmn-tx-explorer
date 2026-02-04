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

// WMezonMetaData contains all meta data concerning the WMezon contract.
var WMezonMetaData = &bind.MetaData{
	ABI: "[{\"inputs\":[{\"internalType\":\"address\",\"name\":\"spender\",\"type\":\"address\"},{\"internalType\":\"uint256\",\"name\":\"value\",\"type\":\"uint256\"}],\"name\":\"approve\",\"outputs\":[{\"internalType\":\"bool\",\"name\":\"\",\"type\":\"bool\"}],\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"uint256\",\"name\":\"initSupply\",\"type\":\"uint256\"}],\"stateMutability\":\"nonpayable\",\"type\":\"constructor\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"spender\",\"type\":\"address\"},{\"internalType\":\"uint256\",\"name\":\"allowance\",\"type\":\"uint256\"},{\"internalType\":\"uint256\",\"name\":\"needed\",\"type\":\"uint256\"}],\"name\":\"ERC20InsufficientAllowance\",\"type\":\"error\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"sender\",\"type\":\"address\"},{\"internalType\":\"uint256\",\"name\":\"balance\",\"type\":\"uint256\"},{\"internalType\":\"uint256\",\"name\":\"needed\",\"type\":\"uint256\"}],\"name\":\"ERC20InsufficientBalance\",\"type\":\"error\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"approver\",\"type\":\"address\"}],\"name\":\"ERC20InvalidApprover\",\"type\":\"error\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"receiver\",\"type\":\"address\"}],\"name\":\"ERC20InvalidReceiver\",\"type\":\"error\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"sender\",\"type\":\"address\"}],\"name\":\"ERC20InvalidSender\",\"type\":\"error\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"spender\",\"type\":\"address\"}],\"name\":\"ERC20InvalidSpender\",\"type\":\"error\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"internalType\":\"address\",\"name\":\"owner\",\"type\":\"address\"},{\"indexed\":true,\"internalType\":\"address\",\"name\":\"spender\",\"type\":\"address\"},{\"indexed\":false,\"internalType\":\"uint256\",\"name\":\"value\",\"type\":\"uint256\"}],\"name\":\"Approval\",\"type\":\"event\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"to\",\"type\":\"address\"},{\"internalType\":\"uint256\",\"name\":\"value\",\"type\":\"uint256\"}],\"name\":\"transfer\",\"outputs\":[{\"internalType\":\"bool\",\"name\":\"\",\"type\":\"bool\"}],\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"internalType\":\"address\",\"name\":\"from\",\"type\":\"address\"},{\"indexed\":true,\"internalType\":\"address\",\"name\":\"to\",\"type\":\"address\"},{\"indexed\":false,\"internalType\":\"uint256\",\"name\":\"value\",\"type\":\"uint256\"}],\"name\":\"Transfer\",\"type\":\"event\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"from\",\"type\":\"address\"},{\"internalType\":\"address\",\"name\":\"to\",\"type\":\"address\"},{\"internalType\":\"uint256\",\"name\":\"value\",\"type\":\"uint256\"}],\"name\":\"transferFrom\",\"outputs\":[{\"internalType\":\"bool\",\"name\":\"\",\"type\":\"bool\"}],\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"anonymous\":false,\"inputs\":[{\"indexed\":true,\"internalType\":\"address\",\"name\":\"from\",\"type\":\"address\"},{\"indexed\":true,\"internalType\":\"address\",\"name\":\"to\",\"type\":\"address\"},{\"indexed\":false,\"internalType\":\"uint256\",\"name\":\"amount\",\"type\":\"uint256\"},{\"indexed\":false,\"internalType\":\"bytes\",\"name\":\"memo\",\"type\":\"bytes\"}],\"name\":\"TransferMemo\",\"type\":\"event\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"to\",\"type\":\"address\"},{\"internalType\":\"uint256\",\"name\":\"amount\",\"type\":\"uint256\"},{\"internalType\":\"bytes\",\"name\":\"memo\",\"type\":\"bytes\"}],\"name\":\"transferWithMemo\",\"outputs\":[{\"internalType\":\"bool\",\"name\":\"\",\"type\":\"bool\"}],\"stateMutability\":\"nonpayable\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"owner\",\"type\":\"address\"},{\"internalType\":\"address\",\"name\":\"spender\",\"type\":\"address\"}],\"name\":\"allowance\",\"outputs\":[{\"internalType\":\"uint256\",\"name\":\"\",\"type\":\"uint256\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[{\"internalType\":\"address\",\"name\":\"account\",\"type\":\"address\"}],\"name\":\"balanceOf\",\"outputs\":[{\"internalType\":\"uint256\",\"name\":\"\",\"type\":\"uint256\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[],\"name\":\"decimals\",\"outputs\":[{\"internalType\":\"uint8\",\"name\":\"\",\"type\":\"uint8\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[],\"name\":\"name\",\"outputs\":[{\"internalType\":\"string\",\"name\":\"\",\"type\":\"string\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[],\"name\":\"symbol\",\"outputs\":[{\"internalType\":\"string\",\"name\":\"\",\"type\":\"string\"}],\"stateMutability\":\"view\",\"type\":\"function\"},{\"inputs\":[],\"name\":\"totalSupply\",\"outputs\":[{\"internalType\":\"uint256\",\"name\":\"\",\"type\":\"uint256\"}],\"stateMutability\":\"view\",\"type\":\"function\"}]",
}

// WMezonABI is the input ABI used to generate the binding from.
// Deprecated: Use WMezonMetaData.ABI instead.
var WMezonABI = WMezonMetaData.ABI

// WMezon is an auto generated Go binding around an Ethereum contract.
type WMezon struct {
	WMezonCaller     // Read-only binding to the contract
	WMezonTransactor // Write-only binding to the contract
	WMezonFilterer   // Log filterer for contract events
}

// WMezonCaller is an auto generated read-only Go binding around an Ethereum contract.
type WMezonCaller struct {
	contract *bind.BoundContract // Generic contract wrapper for the low level calls
}

// WMezonTransactor is an auto generated write-only Go binding around an Ethereum contract.
type WMezonTransactor struct {
	contract *bind.BoundContract // Generic contract wrapper for the low level calls
}

// WMezonFilterer is an auto generated log filtering Go binding around an Ethereum contract events.
type WMezonFilterer struct {
	contract *bind.BoundContract // Generic contract wrapper for the low level calls
}

// WMezonSession is an auto generated Go binding around an Ethereum contract,
// with pre-set call and transact options.
type WMezonSession struct {
	Contract     *WMezon           // Generic contract binding to set the session for
	CallOpts     bind.CallOpts     // Call options to use throughout this session
	TransactOpts bind.TransactOpts // Transaction auth options to use throughout this session
}

// WMezonCallerSession is an auto generated read-only Go binding around an Ethereum contract,
// with pre-set call options.
type WMezonCallerSession struct {
	Contract *WMezonCaller // Generic contract caller binding to set the session for
	CallOpts bind.CallOpts // Call options to use throughout this session
}

// WMezonTransactorSession is an auto generated write-only Go binding around an Ethereum contract,
// with pre-set transact options.
type WMezonTransactorSession struct {
	Contract     *WMezonTransactor // Generic contract transactor binding to set the session for
	TransactOpts bind.TransactOpts // Transaction auth options to use throughout this session
}

// WMezonRaw is an auto generated low-level Go binding around an Ethereum contract.
type WMezonRaw struct {
	Contract *WMezon // Generic contract binding to access the raw methods on
}

// WMezonCallerRaw is an auto generated low-level read-only Go binding around an Ethereum contract.
type WMezonCallerRaw struct {
	Contract *WMezonCaller // Generic read-only contract binding to access the raw methods on
}

// WMezonTransactorRaw is an auto generated low-level write-only Go binding around an Ethereum contract.
type WMezonTransactorRaw struct {
	Contract *WMezonTransactor // Generic write-only contract binding to access the raw methods on
}

// NewWMezon creates a new instance of WMezon, bound to a specific deployed contract.
func NewWMezon(address common.Address, backend bind.ContractBackend) (*WMezon, error) {
	contract, err := bindWMezon(address, backend, backend, backend)
	if err != nil {
		return nil, err
	}
	return &WMezon{WMezonCaller: WMezonCaller{contract: contract}, WMezonTransactor: WMezonTransactor{contract: contract}, WMezonFilterer: WMezonFilterer{contract: contract}}, nil
}

// NewWMezonCaller creates a new read-only instance of WMezon, bound to a specific deployed contract.
func NewWMezonCaller(address common.Address, caller bind.ContractCaller) (*WMezonCaller, error) {
	contract, err := bindWMezon(address, caller, nil, nil)
	if err != nil {
		return nil, err
	}
	return &WMezonCaller{contract: contract}, nil
}

// NewWMezonTransactor creates a new write-only instance of WMezon, bound to a specific deployed contract.
func NewWMezonTransactor(address common.Address, transactor bind.ContractTransactor) (*WMezonTransactor, error) {
	contract, err := bindWMezon(address, nil, transactor, nil)
	if err != nil {
		return nil, err
	}
	return &WMezonTransactor{contract: contract}, nil
}

// NewWMezonFilterer creates a new log filterer instance of WMezon, bound to a specific deployed contract.
func NewWMezonFilterer(address common.Address, filterer bind.ContractFilterer) (*WMezonFilterer, error) {
	contract, err := bindWMezon(address, nil, nil, filterer)
	if err != nil {
		return nil, err
	}
	return &WMezonFilterer{contract: contract}, nil
}

// bindWMezon binds a generic wrapper to an already deployed contract.
func bindWMezon(address common.Address, caller bind.ContractCaller, transactor bind.ContractTransactor, filterer bind.ContractFilterer) (*bind.BoundContract, error) {
	parsed, err := WMezonMetaData.GetAbi()
	if err != nil {
		return nil, err
	}
	return bind.NewBoundContract(address, *parsed, caller, transactor, filterer), nil
}

// Call invokes the (constant) contract method with params as input values and
// sets the output to result. The result type might be a single field for simple
// returns, a slice of interfaces for anonymous returns and a struct for named
// returns.
func (_WMezon *WMezonRaw) Call(opts *bind.CallOpts, result *[]interface{}, method string, params ...interface{}) error {
	return _WMezon.Contract.WMezonCaller.contract.Call(opts, result, method, params...)
}

// Transfer initiates a plain transaction to move funds to the contract, calling
// its default method if one is available.
func (_WMezon *WMezonRaw) Transfer(opts *bind.TransactOpts) (*types.Transaction, error) {
	return _WMezon.Contract.WMezonTransactor.contract.Transfer(opts)
}

// Transact invokes the (paid) contract method with params as input values.
func (_WMezon *WMezonRaw) Transact(opts *bind.TransactOpts, method string, params ...interface{}) (*types.Transaction, error) {
	return _WMezon.Contract.WMezonTransactor.contract.Transact(opts, method, params...)
}

// Call invokes the (constant) contract method with params as input values and
// sets the output to result. The result type might be a single field for simple
// returns, a slice of interfaces for anonymous returns and a struct for named
// returns.
func (_WMezon *WMezonCallerRaw) Call(opts *bind.CallOpts, result *[]interface{}, method string, params ...interface{}) error {
	return _WMezon.Contract.contract.Call(opts, result, method, params...)
}

// Transfer initiates a plain transaction to move funds to the contract, calling
// its default method if one is available.
func (_WMezon *WMezonTransactorRaw) Transfer(opts *bind.TransactOpts) (*types.Transaction, error) {
	return _WMezon.Contract.contract.Transfer(opts)
}

// Transact invokes the (paid) contract method with params as input values.
func (_WMezon *WMezonTransactorRaw) Transact(opts *bind.TransactOpts, method string, params ...interface{}) (*types.Transaction, error) {
	return _WMezon.Contract.contract.Transact(opts, method, params...)
}

// Allowance is a free data retrieval call binding the contract method 0xdd62ed3e.
//
// Solidity: function allowance(address owner, address spender) view returns(uint256)
func (_WMezon *WMezonCaller) Allowance(opts *bind.CallOpts, owner common.Address, spender common.Address) (*big.Int, error) {
	var out []interface{}
	err := _WMezon.contract.Call(opts, &out, "allowance", owner, spender)

	if err != nil {
		return *new(*big.Int), err
	}

	out0 := *abi.ConvertType(out[0], new(*big.Int)).(**big.Int)

	return out0, err

}

// Allowance is a free data retrieval call binding the contract method 0xdd62ed3e.
//
// Solidity: function allowance(address owner, address spender) view returns(uint256)
func (_WMezon *WMezonSession) Allowance(owner common.Address, spender common.Address) (*big.Int, error) {
	return _WMezon.Contract.Allowance(&_WMezon.CallOpts, owner, spender)
}

// Allowance is a free data retrieval call binding the contract method 0xdd62ed3e.
//
// Solidity: function allowance(address owner, address spender) view returns(uint256)
func (_WMezon *WMezonCallerSession) Allowance(owner common.Address, spender common.Address) (*big.Int, error) {
	return _WMezon.Contract.Allowance(&_WMezon.CallOpts, owner, spender)
}

// BalanceOf is a free data retrieval call binding the contract method 0x70a08231.
//
// Solidity: function balanceOf(address account) view returns(uint256)
func (_WMezon *WMezonCaller) BalanceOf(opts *bind.CallOpts, account common.Address) (*big.Int, error) {
	var out []interface{}
	err := _WMezon.contract.Call(opts, &out, "balanceOf", account)

	if err != nil {
		return *new(*big.Int), err
	}

	out0 := *abi.ConvertType(out[0], new(*big.Int)).(**big.Int)

	return out0, err

}

// BalanceOf is a free data retrieval call binding the contract method 0x70a08231.
//
// Solidity: function balanceOf(address account) view returns(uint256)
func (_WMezon *WMezonSession) BalanceOf(account common.Address) (*big.Int, error) {
	return _WMezon.Contract.BalanceOf(&_WMezon.CallOpts, account)
}

// BalanceOf is a free data retrieval call binding the contract method 0x70a08231.
//
// Solidity: function balanceOf(address account) view returns(uint256)
func (_WMezon *WMezonCallerSession) BalanceOf(account common.Address) (*big.Int, error) {
	return _WMezon.Contract.BalanceOf(&_WMezon.CallOpts, account)
}

// Decimals is a free data retrieval call binding the contract method 0x313ce567.
//
// Solidity: function decimals() view returns(uint8)
func (_WMezon *WMezonCaller) Decimals(opts *bind.CallOpts) (uint8, error) {
	var out []interface{}
	err := _WMezon.contract.Call(opts, &out, "decimals")

	if err != nil {
		return *new(uint8), err
	}

	out0 := *abi.ConvertType(out[0], new(uint8)).(*uint8)

	return out0, err

}

// Decimals is a free data retrieval call binding the contract method 0x313ce567.
//
// Solidity: function decimals() view returns(uint8)
func (_WMezon *WMezonSession) Decimals() (uint8, error) {
	return _WMezon.Contract.Decimals(&_WMezon.CallOpts)
}

// Decimals is a free data retrieval call binding the contract method 0x313ce567.
//
// Solidity: function decimals() view returns(uint8)
func (_WMezon *WMezonCallerSession) Decimals() (uint8, error) {
	return _WMezon.Contract.Decimals(&_WMezon.CallOpts)
}

// Name is a free data retrieval call binding the contract method 0x06fdde03.
//
// Solidity: function name() view returns(string)
func (_WMezon *WMezonCaller) Name(opts *bind.CallOpts) (string, error) {
	var out []interface{}
	err := _WMezon.contract.Call(opts, &out, "name")

	if err != nil {
		return *new(string), err
	}

	out0 := *abi.ConvertType(out[0], new(string)).(*string)

	return out0, err

}

// Name is a free data retrieval call binding the contract method 0x06fdde03.
//
// Solidity: function name() view returns(string)
func (_WMezon *WMezonSession) Name() (string, error) {
	return _WMezon.Contract.Name(&_WMezon.CallOpts)
}

// Name is a free data retrieval call binding the contract method 0x06fdde03.
//
// Solidity: function name() view returns(string)
func (_WMezon *WMezonCallerSession) Name() (string, error) {
	return _WMezon.Contract.Name(&_WMezon.CallOpts)
}

// Symbol is a free data retrieval call binding the contract method 0x95d89b41.
//
// Solidity: function symbol() view returns(string)
func (_WMezon *WMezonCaller) Symbol(opts *bind.CallOpts) (string, error) {
	var out []interface{}
	err := _WMezon.contract.Call(opts, &out, "symbol")

	if err != nil {
		return *new(string), err
	}

	out0 := *abi.ConvertType(out[0], new(string)).(*string)

	return out0, err

}

// Symbol is a free data retrieval call binding the contract method 0x95d89b41.
//
// Solidity: function symbol() view returns(string)
func (_WMezon *WMezonSession) Symbol() (string, error) {
	return _WMezon.Contract.Symbol(&_WMezon.CallOpts)
}

// Symbol is a free data retrieval call binding the contract method 0x95d89b41.
//
// Solidity: function symbol() view returns(string)
func (_WMezon *WMezonCallerSession) Symbol() (string, error) {
	return _WMezon.Contract.Symbol(&_WMezon.CallOpts)
}

// TotalSupply is a free data retrieval call binding the contract method 0x18160ddd.
//
// Solidity: function totalSupply() view returns(uint256)
func (_WMezon *WMezonCaller) TotalSupply(opts *bind.CallOpts) (*big.Int, error) {
	var out []interface{}
	err := _WMezon.contract.Call(opts, &out, "totalSupply")

	if err != nil {
		return *new(*big.Int), err
	}

	out0 := *abi.ConvertType(out[0], new(*big.Int)).(**big.Int)

	return out0, err

}

// TotalSupply is a free data retrieval call binding the contract method 0x18160ddd.
//
// Solidity: function totalSupply() view returns(uint256)
func (_WMezon *WMezonSession) TotalSupply() (*big.Int, error) {
	return _WMezon.Contract.TotalSupply(&_WMezon.CallOpts)
}

// TotalSupply is a free data retrieval call binding the contract method 0x18160ddd.
//
// Solidity: function totalSupply() view returns(uint256)
func (_WMezon *WMezonCallerSession) TotalSupply() (*big.Int, error) {
	return _WMezon.Contract.TotalSupply(&_WMezon.CallOpts)
}

// Approve is a paid mutator transaction binding the contract method 0x095ea7b3.
//
// Solidity: function approve(address spender, uint256 value) returns(bool)
func (_WMezon *WMezonTransactor) Approve(opts *bind.TransactOpts, spender common.Address, value *big.Int) (*types.Transaction, error) {
	return _WMezon.contract.Transact(opts, "approve", spender, value)
}

// Approve is a paid mutator transaction binding the contract method 0x095ea7b3.
//
// Solidity: function approve(address spender, uint256 value) returns(bool)
func (_WMezon *WMezonSession) Approve(spender common.Address, value *big.Int) (*types.Transaction, error) {
	return _WMezon.Contract.Approve(&_WMezon.TransactOpts, spender, value)
}

// Approve is a paid mutator transaction binding the contract method 0x095ea7b3.
//
// Solidity: function approve(address spender, uint256 value) returns(bool)
func (_WMezon *WMezonTransactorSession) Approve(spender common.Address, value *big.Int) (*types.Transaction, error) {
	return _WMezon.Contract.Approve(&_WMezon.TransactOpts, spender, value)
}

// Transfer is a paid mutator transaction binding the contract method 0xa9059cbb.
//
// Solidity: function transfer(address to, uint256 value) returns(bool)
func (_WMezon *WMezonTransactor) Transfer(opts *bind.TransactOpts, to common.Address, value *big.Int) (*types.Transaction, error) {
	return _WMezon.contract.Transact(opts, "transfer", to, value)
}

// Transfer is a paid mutator transaction binding the contract method 0xa9059cbb.
//
// Solidity: function transfer(address to, uint256 value) returns(bool)
func (_WMezon *WMezonSession) Transfer(to common.Address, value *big.Int) (*types.Transaction, error) {
	return _WMezon.Contract.Transfer(&_WMezon.TransactOpts, to, value)
}

// Transfer is a paid mutator transaction binding the contract method 0xa9059cbb.
//
// Solidity: function transfer(address to, uint256 value) returns(bool)
func (_WMezon *WMezonTransactorSession) Transfer(to common.Address, value *big.Int) (*types.Transaction, error) {
	return _WMezon.Contract.Transfer(&_WMezon.TransactOpts, to, value)
}

// TransferFrom is a paid mutator transaction binding the contract method 0x23b872dd.
//
// Solidity: function transferFrom(address from, address to, uint256 value) returns(bool)
func (_WMezon *WMezonTransactor) TransferFrom(opts *bind.TransactOpts, from common.Address, to common.Address, value *big.Int) (*types.Transaction, error) {
	return _WMezon.contract.Transact(opts, "transferFrom", from, to, value)
}

// TransferFrom is a paid mutator transaction binding the contract method 0x23b872dd.
//
// Solidity: function transferFrom(address from, address to, uint256 value) returns(bool)
func (_WMezon *WMezonSession) TransferFrom(from common.Address, to common.Address, value *big.Int) (*types.Transaction, error) {
	return _WMezon.Contract.TransferFrom(&_WMezon.TransactOpts, from, to, value)
}

// TransferFrom is a paid mutator transaction binding the contract method 0x23b872dd.
//
// Solidity: function transferFrom(address from, address to, uint256 value) returns(bool)
func (_WMezon *WMezonTransactorSession) TransferFrom(from common.Address, to common.Address, value *big.Int) (*types.Transaction, error) {
	return _WMezon.Contract.TransferFrom(&_WMezon.TransactOpts, from, to, value)
}

// TransferWithMemo is a paid mutator transaction binding the contract method 0xef5ff4d2.
//
// Solidity: function transferWithMemo(address to, uint256 amount, bytes memo) returns(bool)
func (_WMezon *WMezonTransactor) TransferWithMemo(opts *bind.TransactOpts, to common.Address, amount *big.Int, memo []byte) (*types.Transaction, error) {
	return _WMezon.contract.Transact(opts, "transferWithMemo", to, amount, memo)
}

// TransferWithMemo is a paid mutator transaction binding the contract method 0xef5ff4d2.
//
// Solidity: function transferWithMemo(address to, uint256 amount, bytes memo) returns(bool)
func (_WMezon *WMezonSession) TransferWithMemo(to common.Address, amount *big.Int, memo []byte) (*types.Transaction, error) {
	return _WMezon.Contract.TransferWithMemo(&_WMezon.TransactOpts, to, amount, memo)
}

// TransferWithMemo is a paid mutator transaction binding the contract method 0xef5ff4d2.
//
// Solidity: function transferWithMemo(address to, uint256 amount, bytes memo) returns(bool)
func (_WMezon *WMezonTransactorSession) TransferWithMemo(to common.Address, amount *big.Int, memo []byte) (*types.Transaction, error) {
	return _WMezon.Contract.TransferWithMemo(&_WMezon.TransactOpts, to, amount, memo)
}

// WMezonApprovalIterator is returned from FilterApproval and is used to iterate over the raw logs and unpacked data for Approval events raised by the WMezon contract.
type WMezonApprovalIterator struct {
	Event *WMezonApproval // Event containing the contract specifics and raw log

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
func (it *WMezonApprovalIterator) Next() bool {
	// If the iterator failed, stop iterating
	if it.fail != nil {
		return false
	}
	// If the iterator completed, deliver directly whatever's available
	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(WMezonApproval)
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
		it.Event = new(WMezonApproval)
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
func (it *WMezonApprovalIterator) Error() error {
	return it.fail
}

// Close terminates the iteration process, releasing any pending underlying
// resources.
func (it *WMezonApprovalIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

// WMezonApproval represents a Approval event raised by the WMezon contract.
type WMezonApproval struct {
	Owner   common.Address
	Spender common.Address
	Value   *big.Int
	Raw     types.Log // Blockchain specific contextual infos
}

// FilterApproval is a free log retrieval operation binding the contract event 0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925.
//
// Solidity: event Approval(address indexed owner, address indexed spender, uint256 value)
func (_WMezon *WMezonFilterer) FilterApproval(opts *bind.FilterOpts, owner []common.Address, spender []common.Address) (*WMezonApprovalIterator, error) {

	var ownerRule []interface{}
	for _, ownerItem := range owner {
		ownerRule = append(ownerRule, ownerItem)
	}
	var spenderRule []interface{}
	for _, spenderItem := range spender {
		spenderRule = append(spenderRule, spenderItem)
	}

	logs, sub, err := _WMezon.contract.FilterLogs(opts, "Approval", ownerRule, spenderRule)
	if err != nil {
		return nil, err
	}
	return &WMezonApprovalIterator{contract: _WMezon.contract, event: "Approval", logs: logs, sub: sub}, nil
}

// WatchApproval is a free log subscription operation binding the contract event 0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925.
//
// Solidity: event Approval(address indexed owner, address indexed spender, uint256 value)
func (_WMezon *WMezonFilterer) WatchApproval(opts *bind.WatchOpts, sink chan<- *WMezonApproval, owner []common.Address, spender []common.Address) (event.Subscription, error) {

	var ownerRule []interface{}
	for _, ownerItem := range owner {
		ownerRule = append(ownerRule, ownerItem)
	}
	var spenderRule []interface{}
	for _, spenderItem := range spender {
		spenderRule = append(spenderRule, spenderItem)
	}

	logs, sub, err := _WMezon.contract.WatchLogs(opts, "Approval", ownerRule, spenderRule)
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:
				// New log arrived, parse the event and forward to the user
				event := new(WMezonApproval)
				if err := _WMezon.contract.UnpackLog(event, "Approval", log); err != nil {
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
func (_WMezon *WMezonFilterer) ParseApproval(log types.Log) (*WMezonApproval, error) {
	event := new(WMezonApproval)
	if err := _WMezon.contract.UnpackLog(event, "Approval", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

// WMezonTransferIterator is returned from FilterTransfer and is used to iterate over the raw logs and unpacked data for Transfer events raised by the WMezon contract.
type WMezonTransferIterator struct {
	Event *WMezonTransfer // Event containing the contract specifics and raw log

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
func (it *WMezonTransferIterator) Next() bool {
	// If the iterator failed, stop iterating
	if it.fail != nil {
		return false
	}
	// If the iterator completed, deliver directly whatever's available
	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(WMezonTransfer)
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
		it.Event = new(WMezonTransfer)
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
func (it *WMezonTransferIterator) Error() error {
	return it.fail
}

// Close terminates the iteration process, releasing any pending underlying
// resources.
func (it *WMezonTransferIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

// WMezonTransfer represents a Transfer event raised by the WMezon contract.
type WMezonTransfer struct {
	From  common.Address
	To    common.Address
	Value *big.Int
	Raw   types.Log // Blockchain specific contextual infos
}

// FilterTransfer is a free log retrieval operation binding the contract event 0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef.
//
// Solidity: event Transfer(address indexed from, address indexed to, uint256 value)
func (_WMezon *WMezonFilterer) FilterTransfer(opts *bind.FilterOpts, from []common.Address, to []common.Address) (*WMezonTransferIterator, error) {

	var fromRule []interface{}
	for _, fromItem := range from {
		fromRule = append(fromRule, fromItem)
	}
	var toRule []interface{}
	for _, toItem := range to {
		toRule = append(toRule, toItem)
	}

	logs, sub, err := _WMezon.contract.FilterLogs(opts, "Transfer", fromRule, toRule)
	if err != nil {
		return nil, err
	}
	return &WMezonTransferIterator{contract: _WMezon.contract, event: "Transfer", logs: logs, sub: sub}, nil
}

// WatchTransfer is a free log subscription operation binding the contract event 0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef.
//
// Solidity: event Transfer(address indexed from, address indexed to, uint256 value)
func (_WMezon *WMezonFilterer) WatchTransfer(opts *bind.WatchOpts, sink chan<- *WMezonTransfer, from []common.Address, to []common.Address) (event.Subscription, error) {

	var fromRule []interface{}
	for _, fromItem := range from {
		fromRule = append(fromRule, fromItem)
	}
	var toRule []interface{}
	for _, toItem := range to {
		toRule = append(toRule, toItem)
	}

	logs, sub, err := _WMezon.contract.WatchLogs(opts, "Transfer", fromRule, toRule)
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:
				// New log arrived, parse the event and forward to the user
				event := new(WMezonTransfer)
				if err := _WMezon.contract.UnpackLog(event, "Transfer", log); err != nil {
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
func (_WMezon *WMezonFilterer) ParseTransfer(log types.Log) (*WMezonTransfer, error) {
	event := new(WMezonTransfer)
	if err := _WMezon.contract.UnpackLog(event, "Transfer", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}

// WMezonTransferMemoIterator is returned from FilterTransferMemo and is used to iterate over the raw logs and unpacked data for TransferMemo events raised by the WMezon contract.
type WMezonTransferMemoIterator struct {
	Event *WMezonTransferMemo // Event containing the contract specifics and raw log

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
func (it *WMezonTransferMemoIterator) Next() bool {
	// If the iterator failed, stop iterating
	if it.fail != nil {
		return false
	}
	// If the iterator completed, deliver directly whatever's available
	if it.done {
		select {
		case log := <-it.logs:
			it.Event = new(WMezonTransferMemo)
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
		it.Event = new(WMezonTransferMemo)
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
func (it *WMezonTransferMemoIterator) Error() error {
	return it.fail
}

// Close terminates the iteration process, releasing any pending underlying
// resources.
func (it *WMezonTransferMemoIterator) Close() error {
	it.sub.Unsubscribe()
	return nil
}

// WMezonTransferMemo represents a TransferMemo event raised by the WMezon contract.
type WMezonTransferMemo struct {
	From   common.Address
	To     common.Address
	Amount *big.Int
	Memo   []byte
	Raw    types.Log // Blockchain specific contextual infos
}

// FilterTransferMemo is a free log retrieval operation binding the contract event 0x21de3ad89e9fa1e37bf684b537343eb04657fea1c311be92b5f1f8547bb0622b.
//
// Solidity: event TransferMemo(address indexed from, address indexed to, uint256 amount, bytes memo)
func (_WMezon *WMezonFilterer) FilterTransferMemo(opts *bind.FilterOpts, from []common.Address, to []common.Address) (*WMezonTransferMemoIterator, error) {

	var fromRule []interface{}
	for _, fromItem := range from {
		fromRule = append(fromRule, fromItem)
	}
	var toRule []interface{}
	for _, toItem := range to {
		toRule = append(toRule, toItem)
	}

	logs, sub, err := _WMezon.contract.FilterLogs(opts, "TransferMemo", fromRule, toRule)
	if err != nil {
		return nil, err
	}
	return &WMezonTransferMemoIterator{contract: _WMezon.contract, event: "TransferMemo", logs: logs, sub: sub}, nil
}

// WatchTransferMemo is a free log subscription operation binding the contract event 0x21de3ad89e9fa1e37bf684b537343eb04657fea1c311be92b5f1f8547bb0622b.
//
// Solidity: event TransferMemo(address indexed from, address indexed to, uint256 amount, bytes memo)
func (_WMezon *WMezonFilterer) WatchTransferMemo(opts *bind.WatchOpts, sink chan<- *WMezonTransferMemo, from []common.Address, to []common.Address) (event.Subscription, error) {

	var fromRule []interface{}
	for _, fromItem := range from {
		fromRule = append(fromRule, fromItem)
	}
	var toRule []interface{}
	for _, toItem := range to {
		toRule = append(toRule, toItem)
	}

	logs, sub, err := _WMezon.contract.WatchLogs(opts, "TransferMemo", fromRule, toRule)
	if err != nil {
		return nil, err
	}
	return event.NewSubscription(func(quit <-chan struct{}) error {
		defer sub.Unsubscribe()
		for {
			select {
			case log := <-logs:
				// New log arrived, parse the event and forward to the user
				event := new(WMezonTransferMemo)
				if err := _WMezon.contract.UnpackLog(event, "TransferMemo", log); err != nil {
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
func (_WMezon *WMezonFilterer) ParseTransferMemo(log types.Log) (*WMezonTransferMemo, error) {
	event := new(WMezonTransferMemo)
	if err := _WMezon.contract.UnpackLog(event, "TransferMemo", log); err != nil {
		return nil, err
	}
	event.Raw = log
	return event, nil
}
