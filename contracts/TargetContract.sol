// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;
import "@openzeppelin/contracts/access/Ownable.sol";

contract TargetContract is Ownable {
    event Fn1Accessed(address sender);
    event Fn2Accessed(address sender);
    event Fn3Accessed(address sender);

    constructor(address RBAC_PROXY_Address) {
        require(RBAC_PROXY_Address != address(0), "must specify owner of the contract");
        transferOwnership(RBAC_PROXY_Address);
    }

    function targetFn1() public onlyOwner {
        emit Fn1Accessed(msg.sender);
    }

    function targetFn2() public onlyOwner {
        emit Fn2Accessed(msg.sender);
    }

    function targetFn3() public onlyOwner {
        emit Fn3Accessed(msg.sender);
    }
}
