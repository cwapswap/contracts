// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract L1ToCwebERC20 {
    using SafeERC20 for IERC20;

    event RequestExecuted(
        uint256 indexed _requestId, 
        uint256 indexed _nonce,  
        address  _recipient, 
        uint256 _amount
    );

    mapping (bytes32 => uint256[2]) alreadyPaid;

    IERC20 public associatedToken;

    constructor(IERC20 _token) {
        associatedToken = _token;
    }

    function createAlreadyPaidKey(address _recipient, uint256 _positionId) internal pure returns(bytes32) {
        return keccak256(abi.encodePacked(_recipient, _positionId));
    }

    function executeRequest(
        uint256 _requestId, 
        uint256 _maxPaidAllowed, 
        address _recipient, 
        uint256 _amount
    ) external {
        bytes32 _key = createAlreadyPaidKey(_recipient, _requestId);
        uint256 _paid = alreadyPaid[_key][0];

        require(_paid + _amount <= _maxPaidAllowed, "Can't be paid");

        uint256 nonce = alreadyPaid[_key][1];
        alreadyPaid[_key] = [_paid + _amount, nonce + 1];

        associatedToken.safeTransferFrom(
            msg.sender,
            _recipient,
            _amount
        );
        
        emit RequestExecuted(_requestId, nonce, _recipient, _amount);
    }
}
