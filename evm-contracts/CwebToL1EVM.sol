// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract CwebToL1EVM {
    event PositionAccepted(
        uint256 indexed _positionId,
        uint256 indexed _nonce,
        address  _recipient, 
        uint256 _amount,
        bytes _data
    );

    mapping (bytes32 => uint256[2]) alreadyPaid;

    function createAlreadyPaidKey(address _recipient, uint256 _positionId) internal pure returns(bytes32) {
        return keccak256(abi.encodePacked(_recipient, _positionId));
    }

    function acceptPosition(
        uint256 _positionId, 
        uint256 _maxPaidAllowed, 
        address payable _recipient, 
        uint256 _amount, 
        bytes calldata _data
    ) external payable {
        require(msg.value >= _amount, "Insufficient ETH sent");
        
        bytes32 _key = createAlreadyPaidKey(_recipient, _positionId);
        uint256 _paid = alreadyPaid[_key][0];

        require(_paid + _amount <= _maxPaidAllowed, "Can't be paid");

        uint256 nonce = alreadyPaid[_key][1];

        alreadyPaid[_key] = [_paid + _amount, nonce + 1];
        
        _recipient.transfer(_amount);
        
        emit PositionAccepted(_positionId, nonce, _recipient, _amount, _data);
    }
}
