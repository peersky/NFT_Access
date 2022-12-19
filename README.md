#RBAC POC WITH NFTs

## Concept

TargetContract.sol is being owned by NFTRBAC_Proxy.sol 

which allows to call function on TargetContract only if function caller has ERC1155 token wich pool id equal to `uint32 signature = uint32(msg.sig);` 

