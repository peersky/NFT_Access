// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;
import {IERC1155} from "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";

contract NFTRBAC_Proxy {
    address tokenAddress;
    address targetAddress;

    constructor(address _tokenAddress, address _targetAddress) {
        require(_tokenAddress != address(0), "must specify owner of the contract");
        tokenAddress = _tokenAddress;
        targetAddress = _targetAddress;
    }

    fallback() external payable {
        // get signature
        uint32 signature = uint32(msg.sig);

        IERC1155 rbacToken = IERC1155(tokenAddress);

        uint256 tokenId = uint256(signature);

        // Here we could check if interface is ERC721 || ERC1155
        require(rbacToken.balanceOf(msg.sender, tokenId) > 0, "Forbidden by NFTRBAC");

        // We also could use more sopisticated rules, considering that we have 32 bytes of token Id's 
        // And 4 bytes of function signatures that occupy 4 MSB's, we have 28 LSB's left. 


        // Execute external function from facet using delegatecall and return any value.
        bytes memory data = msg.data;
        uint256 value = msg.value;
        uint256 txGas = gasleft();
        address to = targetAddress;
        bool success;
        assembly {
            success := call(txGas, to, value, add(data, 0x20), mload(data), 0, 0)
            returndatacopy(0, 0, returndatasize())
            switch success
            case 0 {
                revert(0, returndatasize())
            }
            default {
                return(0, returndatasize())
            }
        }
    }
}
