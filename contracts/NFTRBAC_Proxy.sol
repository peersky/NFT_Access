// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;
import {ERC1155Burnable} from "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Burnable.sol";

// solc-ignore-next-line missing-receive
contract NFTRBAC_Proxy {
    enum RequirementTypeEnum {
        HAVE,
        LOCK,
        BURN,
        PAY
    }

    address tokenAddress;
    address targetAddress;

    constructor(address _tokenAddress, address _targetAddress) {
        require(_tokenAddress != address(0), "must specify owner of the contract");
        tokenAddress = _tokenAddress;
        targetAddress = _targetAddress;
    }

    function _detectLeastRequirementType(uint256 tokenId) internal view returns (RequirementTypeEnum) {
        ERC1155Burnable rbacToken = ERC1155Burnable(tokenAddress);

        if (rbacToken.balanceOf(msg.sender, tokenId) > 0) return RequirementTypeEnum.HAVE;
        if (rbacToken.balanceOf(msg.sender, tokenId + 1) > 0) return RequirementTypeEnum.LOCK;
        if (rbacToken.balanceOf(msg.sender, tokenId + 2) > 0) return RequirementTypeEnum.BURN;
        if (rbacToken.balanceOf(msg.sender, tokenId + 3) > 0) return RequirementTypeEnum.PAY;
        else revert("Forbidden by NFTRBAC");
    }

    function getTokenId(uint256 tokenId, RequirementTypeEnum requirementType) internal pure returns (uint256) {
        return tokenId + uint256(requirementType);
    }

    fallback() external payable {
        // get signature
        uint32 signature = uint32(msg.sig);

        ERC1155Burnable rbacToken = ERC1155Burnable(tokenAddress);

        uint256 tokenBaseId = uint256(signature);
        RequirementTypeEnum senderMust = _detectLeastRequirementType(tokenBaseId);
        uint256 tokenId = getTokenId(tokenBaseId, senderMust);
        // Here we could check if interface is ERC721 || ERC1155

        if (senderMust == RequirementTypeEnum.BURN) {
            rbacToken.burn(msg.sender, tokenId, 1);
        } else if (senderMust == RequirementTypeEnum.LOCK) {
            rbacToken.safeTransferFrom(msg.sender, address(this), tokenId, 1, bytes(""));
        } else if (senderMust == RequirementTypeEnum.PAY) {
            rbacToken.safeTransferFrom(msg.sender, targetAddress, tokenId, 1, bytes(""));
        }

        // Execute external function from facet using delegatecall and return any value.
        bytes memory data = msg.data;
        uint256 value = msg.value;
        uint256 txGas = gasleft();
        address to = targetAddress;
        bool success;
        assembly {
            success := call(txGas, to, value, add(data, 0x20), mload(data), 0, 0)
            returndatacopy(0, 0, returndatasize())
        }
        if (senderMust == RequirementTypeEnum.LOCK) {
            rbacToken.safeTransferFrom(address(this), msg.sender, tokenId, 1, bytes(""));
        }
        assembly {
            switch success
            case 0 {
                revert(0, returndatasize())
            }
            default {
                return(0, returndatasize())
            }
        }
    }

    function onERC1155Received(
        address operator,
        address,
        uint256,
        uint256,
        bytes calldata
    ) public view returns (bytes4) {
        if (operator == address(this)) {
            return bytes4(keccak256("onERC1155Received(address,address,uint256,uint256,bytes)"));
        }
        return bytes4("");
    }
}
