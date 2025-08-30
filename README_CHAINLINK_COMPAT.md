# Chainlink Compatibility 모드(Gelato VRF)

- Gelato VRF의 Chainlink Compatibility 모드를 사용할 때는 스마트컨트랙트가 VRFConsumerBaseV2를 상속해야 하며,
- VRFCoordinatorV2Interface, keyHash, subscriptionId 등 Chainlink VRF와 동일한 방식으로 연동합니다.
- 배포 후 Subscription에 컨트랙트 주소를 Consumer로 등록해야 합니다.
- 자세한 사용법은 Chainlink 공식 문서와 Gelato VRF 문서를 참고하세요.
