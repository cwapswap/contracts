// SPDX-License-Identifier: MIT
pragma solidity 0.8.27;

contract C1Evm {
    event Transfer(
        uint256 indexed _l2LinkedId,
        uint256 indexed _nonce,
        address  _recipient, 
        uint256 _amount,
        bytes _data
    );

    mapping (bytes32 => uint256[2]) alreadyPaid;

    function createAlreadyPaidKey(address _recipient, uint256 _l2LinkedId) internal pure returns(bytes32) {
        return keccak256(abi.encodePacked(_recipient, _l2LinkedId));
    }

    function transfer(
        uint256 _l2LinkedId, 
        uint256 _maxAllowedPayment, 
        address payable _recipient, 
        bytes calldata _data
    ) external payable {
        require(_recipient != address(0) && _recipient != address(this), "Incorrect recipient");
        
        require(msg.value >= 1, "Payment less than min");

        bytes32 _key = createAlreadyPaidKey(_recipient, _l2LinkedId);
        uint256 _paid = alreadyPaid[_key][0];

        require(_paid + msg.value <= _maxAllowedPayment, "Overpay");

        uint256 nonce = alreadyPaid[_key][1];

        alreadyPaid[_key] = [_paid + msg.value, nonce + 1];
        
        (bool success, ) = _recipient.call{value: msg.value}("");
        require(success, "Transfer failed");
        
        emit Transfer(_l2LinkedId, nonce, _recipient, msg.value, _data);
    }

    function paidFor(uint256 _l2LinkedId, address _recipient) external view returns (uint256) {
        bytes32 _key = createAlreadyPaidKey(_recipient, _l2LinkedId);

        return alreadyPaid[_key][0];
    }
}
