// SPDX-License-Identifier: MIT
pragma solidity 0.8.27;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract C1Erc20Bep20 {
    using SafeERC20 for IERC20;

    event Transfer(
        uint256 indexed _l2LinkedId, 
        uint256 indexed _nonce,  
        address  _recipient, 
        uint256 _amount
    );

    mapping (bytes32 => uint256[2]) alreadyPaid;

    IERC20 public associatedToken;

    constructor(IERC20 _token) {
        require(address(_token) != address(0), "Token address cannot be zero");

        associatedToken = _token;
    }

    function createAlreadyPaidKey(address _recipient, uint256 _l2LinkedId) internal pure returns(bytes32) {
        return keccak256(abi.encodePacked(_recipient, _l2LinkedId));
    }

    function transfer(
        uint256 _l2LinkedId, 
        uint256 _maxAllowedPayment, 
        address _recipient, 
        uint256 _amount
    ) external {
        require(_amount >= 1, "Payment less than min");

        bytes32 _key = createAlreadyPaidKey(_recipient, _l2LinkedId);
        uint256 _paid = alreadyPaid[_key][0];

        require(_paid + _amount <= _maxAllowedPayment, "Overpay");

        uint256 nonce = alreadyPaid[_key][1];
        alreadyPaid[_key] = [_paid + _amount, nonce + 1];

        associatedToken.safeTransferFrom(
            msg.sender,
            _recipient,
            _amount
        );
        
        emit Transfer(_l2LinkedId, nonce, _recipient, _amount);
    }

    function paidFor(uint256 _l2LinkedId, address _recipient) external view returns (uint256) {
        bytes32 _key = createAlreadyPaidKey(_recipient, _l2LinkedId);

        return alreadyPaid[_key][0];
    }
}
