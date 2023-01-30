# ACCESS PERMISSIONS POC WITH NFTs

## Concept

Any method call signature in EVM maps down to 4 bytes message signature which is equivalent of `uint32`.

On the other hand, NFT token Ids can be pretty much anything in number space of  `uint256`. Which means there is intersection between those two spaces that can be used to define access permissions. 

In this proof of concept, called method signature is used to calculate token Ids which are needed to access the method. 

Since the space of uint256 larget then uint32, multiple tokens can be defined actually to access same function. In this PoC this is shown by having four different kinds of access: by having a token, by locking a token, by burning a token and by paying a token. 

Tests are provided in test directory. 

## Access checks in proxy
Proxy Stores record of ERC1155 token contract that is used for access permissions.

Proxy itself has no methods, any call to it will result `fallback()` function call, in which it will 
1. Check that ERC1155 permissions are met by sender
2. Make call to implementation (target) contract

Implementation can be accessed in four different ways. Proxy prioritizes access in following order:
1. By Having a token 
2. By Locking a token for a time of target contract code execution
3. By Burning a token
4. By sending (paying) a token to target contract 

With tokens in 1-4 having different Ids. Hence if you have token that fulfills #1, it prioritize and will not check for 2-4 conditions. If you have token that fulfills #2 it will not check 3-4 conditions etc. 

### Token ID calculaton

Base token ID is calculated as signature of method being called: `uint256 baseTokenId = uint32(msg.sig);` 
`baseTokenId` is being offset by enumeration of possible access ways: 
```
0. To have token baseTokenId+0
1. To lock token baseTokenId+1
2. To burn token baseTokenId+2
3. To pay token baseTokenId+3
```

## Calling contract

In this PoC main goal is to demonstrate ability to have perission checks by NFT. The call is demonstrated by simple assembly `call` method.

