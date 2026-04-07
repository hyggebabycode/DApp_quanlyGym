const { ethers } = require("../services/contract");
const { ValidationError } = require("../utils/errors");

function validateAddress(req, res, next) {
  const address = req.params.address || req.body.address;
  if (address && !ethers.isAddress(address)) {
    return next(new ValidationError("Địa chỉ ví Ethereum không hợp lệ"));
  }
  next();
}

function validateFeeBody(req, res, next) {
  const { feeEth } = req.body;
  if (!feeEth) {
    return next(new ValidationError('Thiếu trường "feeEth" trong body'));
  }
  if (isNaN(feeEth) || Number(feeEth) <= 0) {
    return next(new ValidationError("feeEth phải là số dương"));
  }
  next();
}

function validateAddressBody(req, res, next) {
  const { address } = req.body;
  if (!address) {
    return next(new ValidationError('Thiếu trường "address" trong body'));
  }
  if (!ethers.isAddress(address)) {
    return next(new ValidationError("Địa chỉ ví Ethereum không hợp lệ"));
  }
  next();
}

module.exports = { validateAddress, validateFeeBody, validateAddressBody };
