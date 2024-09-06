// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract L1ToCwebEVM {
    event RequestExecuted(
        uint256 indexed _requestId,
        uint256 indexed _nonce,
        address  _recipient, 
        uint256 _amount
    );

    mapping (bytes32 => uint256[2]) alreadyPaid;

    function createAlreadyPaidKey(address _recipient, uint256 _positionId) internal pure returns(bytes32) {
        return keccak256(abi.encodePacked(_recipient, _positionId));
    }

    function executeRequest(
        uint256 _requestId, 
        uint256 _maxPaidAllowed, 
        address payable _recipient, 
        uint256 _amount
    ) external payable {
        require(msg.value >= _amount, "Insufficient ETH sent");
        
        bytes32 _key = createAlreadyPaidKey(_recipient, _requestId);
        uint256 _paid = alreadyPaid[_key][0];

        require(_paid + _amount <= _maxPaidAllowed, "Can't be paid");

        uint256 nonce = alreadyPaid[_key][1];

        alreadyPaid[_key] = [_paid + _amount, nonce + 1];
        
        _recipient.transfer(_amount);
        
        emit RequestExecuted(_requestId, nonce, _recipient, _amount);
    }
}
