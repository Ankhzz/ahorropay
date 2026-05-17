// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract AhorroPay is ReentrancyGuard {
    IERC20 public immutable cUSD;

    enum CircleState { Pending, Active, Completed, Disputed }

    struct Circle {
        address creator;
        uint96 amountPerRound;
        uint32 duration;
        uint8 maxMembers;
        uint8 memberCount;
        uint8 currentRound;
        uint40 startTime;
        address currentReceiver;
        CircleState state;
    }

    Circle[] public circles;
    mapping(uint256 => address[]) public members;
    mapping(uint256 => mapping(address => bool)) public isMember;
    mapping(uint256 => mapping(uint256 => mapping(address => bool))) public contributed;
    mapping(uint256 => uint256) public roundPot;
    mapping(uint256 => mapping(uint256 => bool)) public roundClaimed;

    event CircleCreated(uint256 indexed circleId, address indexed creator, uint256 amount, uint8 maxMembers);
    event MemberJoined(uint256 indexed circleId, address indexed member);
    event CircleStarted(uint256 indexed circleId);
    event ContributionMade(uint256 indexed circleId, uint256 indexed round, address indexed member);
    event PayoutClaimed(uint256 indexed circleId, uint256 indexed round, address indexed receiver);
    event CircleDisputed(uint256 indexed circleId);
    event DisputeResolved(uint256 indexed circleId);

    error NotCreator();
    error NotMember();
    error CircleFull();
    error AlreadyMember();
    error NotPending();
    error NotActive();
    error AlreadyContributed();
    error AlreadyClaimed();
    error NotEnoughMembers();
    error TransferFailed();
    error NotDisputed();
    error TooEarlyForDispute();
    error NotReceiverTurn();
    error MinTwoMembers();
    error ZeroAmount();

    constructor(address _cUSD) {
        cUSD = IERC20(_cUSD);
    }

    function createCircle(uint96 amountPerRound, uint32 duration, uint8 maxMembers)
        external
        returns (uint256 circleId)
    {
        if (maxMembers < 2) revert MinTwoMembers();
        if (amountPerRound == 0) revert ZeroAmount();

        circleId = circles.length;
        circles.push(Circle({
            creator: msg.sender,
            amountPerRound: amountPerRound,
            duration: duration,
            maxMembers: maxMembers,
            memberCount: 1,
            currentRound: 0,
            startTime: 0,
            currentReceiver: address(0),
            state: CircleState.Pending
        }));

        isMember[circleId][msg.sender] = true;
        members[circleId].push(msg.sender);

        emit CircleCreated(circleId, msg.sender, amountPerRound, maxMembers);
    }

    function joinCircle(uint256 circleId) external {
        Circle storage c = circles[circleId];
        if (c.state != CircleState.Pending) revert NotPending();
        if (c.memberCount >= c.maxMembers) revert CircleFull();
        if (isMember[circleId][msg.sender]) revert AlreadyMember();

        isMember[circleId][msg.sender] = true;
        members[circleId].push(msg.sender);
        c.memberCount++;

        emit MemberJoined(circleId, msg.sender);

        if (c.memberCount == c.maxMembers) {
            _startCircle(circleId);
        }
    }

    function startCircle(uint256 circleId) external {
        Circle storage c = circles[circleId];
        if (c.state != CircleState.Pending) revert NotPending();
        if (c.memberCount < 2) revert NotEnoughMembers();
        _startCircle(circleId);
    }

    function contribute(uint256 circleId) external nonReentrant {
        Circle storage c = circles[circleId];
        if (c.state != CircleState.Active) revert NotActive();
        if (!isMember[circleId][msg.sender]) revert NotMember();
        if (contributed[circleId][c.currentRound][msg.sender]) revert AlreadyContributed();

        contributed[circleId][c.currentRound][msg.sender] = true;
        roundPot[circleId] += c.amountPerRound;

        bool ok = cUSD.transferFrom(msg.sender, address(this), c.amountPerRound);
        if (!ok) revert TransferFailed();

        emit ContributionMade(circleId, c.currentRound, msg.sender);

        if (_allContributed(circleId)) {
            _payAndAdvance(circleId);
        }
    }

    function claimPayout(uint256 circleId) external nonReentrant {
        Circle storage c = circles[circleId];
        if (c.state != CircleState.Active) revert NotActive();
        if (msg.sender != c.currentReceiver) revert NotReceiverTurn();
        if (roundClaimed[circleId][c.currentRound]) revert AlreadyClaimed();

        _payAndAdvance(circleId);
    }

    function dispute(uint256 circleId) external {
        Circle storage c = circles[circleId];
        if (c.state != CircleState.Active) revert NotActive();

        uint256 deadline = c.startTime + (uint256(c.currentRound) + 1) * c.duration;
        if (block.timestamp <= deadline) revert TooEarlyForDispute();

        c.state = CircleState.Disputed;
        emit CircleDisputed(circleId);
    }

    function resolveDispute(uint256 circleId) external {
        Circle storage c = circles[circleId];
        if (c.state != CircleState.Disputed) revert NotDisputed();
        if (msg.sender != c.creator) revert NotCreator();

        c.state = CircleState.Active;
        emit DisputeResolved(circleId);
    }

    function _startCircle(uint256 circleId) private {
        Circle storage c = circles[circleId];
        c.state = CircleState.Active;
        c.startTime = uint40(block.timestamp);
        c.currentReceiver = members[circleId][0];
        emit CircleStarted(circleId);
    }

    function _allContributed(uint256 circleId) private view returns (bool) {
        Circle storage c = circles[circleId];
        address[] storage mems = members[circleId];
        uint256 round = c.currentRound;
        for (uint256 i = 0; i < mems.length; i++) {
            if (!contributed[circleId][round][mems[i]]) {
                return false;
            }
        }
        return true;
    }

    function _payAndAdvance(uint256 circleId) private {
        Circle storage c = circles[circleId];
        uint256 pot = roundPot[circleId];
        roundPot[circleId] = 0;
        roundClaimed[circleId][c.currentRound] = true;

        bool ok = cUSD.transfer(c.currentReceiver, pot);
        if (!ok) revert TransferFailed();

        emit PayoutClaimed(circleId, c.currentRound, c.currentReceiver);

        if (c.currentRound + 1 >= c.memberCount) {
            c.state = CircleState.Completed;
            return;
        }

        c.currentRound++;
        c.currentReceiver = members[circleId][c.currentRound];
    }

    function getCircle(uint256 circleId)
        external
        view
        returns (
            address creator,
            uint256 amountPerRound,
            uint256 duration,
            uint8 maxMembers,
            uint8 memberCount,
            uint8 currentRound,
            uint256 startTime,
            address currentReceiver,
            CircleState state,
            address[] memory memberList
        )
    {
        Circle storage c = circles[circleId];
        memberList = members[circleId];
        return (
            c.creator,
            c.amountPerRound,
            c.duration,
            c.maxMembers,
            c.memberCount,
            c.currentRound,
            c.startTime,
            c.currentReceiver,
            c.state,
            memberList
        );
    }

    function getCirclesByHolder(address holder) external view returns (uint256[] memory) {
        uint256 count = 0;
        for (uint256 i = 0; i < circles.length; i++) {
            if (isMember[i][holder]) {
                count++;
            }
        }
        uint256[] memory result = new uint256[](count);
        uint256 index = 0;
        for (uint256 i = 0; i < circles.length; i++) {
            if (isMember[i][holder]) {
                result[index] = i;
                index++;
            }
        }
        return result;
    }

    function getCircleCount() external view returns (uint256) {
        return circles.length;
    }
}