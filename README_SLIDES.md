# 발표 자료 사용 가이드

## 🎯 추천 옵션

### 1. Slidev (Mermaid 기본 지원) ⭐ 추천!

**장점:**
- ✅ Mermaid 다이어그램 기본 지원
- ✅ 코드 하이라이팅 우수
- ✅ 개발자 친화적
- ✅ 라이브 리로드

**설치 및 실행:**
```bash
# Slidev 설치
npm install -g @slidev/cli

# 프레젠테이션 시작
slidev slides.md

# PDF 내보내기
slidev export slides.md --format pdf
```

**브라우저에서 확인:**
```
http://localhost:3030
```

---

### 2. Marp + 이미지 변환

**Mermaid를 이미지로 변환 후 Marp에 삽입**

```bash
# Mermaid CLI 설치
npm install -g @mermaid-js/mermaid-cli

# Mermaid 다이어그램을 이미지로 변환
mmdc -i diagram.mmd -o diagram.png

# Marp으로 슬라이드 생성
marp PRESENTATION.md --pdf
```

**PRESENTATION.md에서 사용:**
```markdown
![CCIP Architecture](./images/ccip-architecture.png)
```

---

### 3. reveal.js (Mermaid 플러그인)

**고급 프레젠테이션 기능 + Mermaid**

```bash
# reveal.js 설치
git clone https://github.com/hakimel/reveal.js.git
cd reveal.js && npm install

# reveal.js-mermaid 플러그인 추가
npm install reveal.js-mermaid-plugin
```

---

### 4. HackMD / Google Slides

**온라인 협업 도구**

- **HackMD**: Markdown + Mermaid 자동 렌더링
  - https://hackmd.io
  - PRESENTATION.md 복붙 → 즉시 사용 가능

- **Google Slides**: Mermaid Live Editor로 이미지 생성
  - https://mermaid.live
  - Mermaid 코드 입력 → PNG 다운로드 → 슬라이드 삽입

---

## 🚀 빠른 시작 (Slidev 추천)

### Step 1: Slidev 설치
```bash
npm install -g @slidev/cli
```

### Step 2: 프레젠테이션 시작
```bash
cd /Users/myunghyun/claude/playground/monad-blitz/minecraft-pfp
slidev slides.md
```

### Step 3: 발표 모드
- **발표자 노트**: 브라우저에서 `s` 키
- **다음 슬라이드**: `Space` 또는 `→`
- **개요 보기**: `o` 키
- **드로잉 모드**: `d` 키

### Step 4: PDF 내보내기
```bash
slidev export slides.md --format pdf -o minecraft-pfp-presentation.pdf
```

---

## 📊 Mermaid 다이어그램 미리보기

### 온라인 에디터
- **Mermaid Live Editor**: https://mermaid.live
  - 실시간 미리보기
  - PNG/SVG 다운로드
  - 코드 공유

### VS Code 확장
```bash
# VS Code에서 Mermaid 미리보기
code --install-extension bierner.markdown-mermaid
```

---

## 🎨 Slidev 테마 커스터마이징

### slides.md 상단 설정
```yaml
---
theme: default  # 또는 seriph, apple-basic 등
highlighter: shiki
lineNumbers: true
---
```

### 사용 가능한 테마
- `default`: 기본 테마
- `seriph`: 우아한 세리프 폰트
- `apple-basic`: Apple Keynote 스타일
- `shibainu`: 귀여운 시바견 테마
- `geist`: Vercel 스타일

---

## 💡 발표 팁

### Slidev 단축키
- `f`: 전체화면
- `o`: 슬라이드 개요
- `d`: 드로잉 모드 (펜으로 표시)
- `g`: 특정 슬라이드로 이동
- `s`: 발표자 노트 + 타이머

### Mermaid 애니메이션
```markdown
# 클릭하면 나타나는 다이어그램
<v-click>

\`\`\`mermaid
graph LR
  A --> B
\`\`\`

</v-click>
```

### 코드 하이라이팅
```markdown
\`\`\`solidity {1-3|5-7|all}
// 1-3줄 하이라이트
function mint() { ... }

// 5-7줄 하이라이트
function verify() { ... }
\`\`\`
```

---

## 🔄 대안: Mermaid를 이미지로 변환

### 자동 변환 스크립트

**scripts/mermaid-to-images.sh:**
```bash
#!/bin/bash

# PRESENTATION.md에서 Mermaid 코드 블록 추출 및 이미지 변환
grep -Pzo '```mermaid.*?```' PRESENTATION.md | \
  mmdc -i - -o images/diagram-{index}.png

echo "Mermaid 다이어그램이 images/ 폴더에 저장되었습니다."
```

**실행:**
```bash
chmod +x scripts/mermaid-to-images.sh
./scripts/mermaid-to-images.sh
```

---

## 📁 파일 구조

```
minecraft-pfp/
├── PRESENTATION.md          # 원본 발표 자료 (텍스트 + Mermaid 코드)
├── slides.md                # Slidev용 슬라이드 (Mermaid 렌더링 지원)
├── README_SLIDES.md         # 이 파일 (사용 가이드)
└── images/                  # Mermaid 다이어그램 이미지 (Marp용)
    ├── ccip-architecture.png
    ├── ccip-sequence.png
    └── ...
```

---

## 🎯 최종 추천

### 해커톤 발표 시나리오

1. **로컬 발표 (추천)**
   - Slidev 사용
   - `slidev slides.md` 실행
   - 브라우저에서 발표 (`localhost:3030`)
   - Mermaid 자동 렌더링 ✅

2. **PDF 제출용**
   - Slidev로 PDF 생성
   - `slidev export slides.md --pdf`
   - 또는 Marp + 이미지 변환

3. **온라인 공유**
   - HackMD에 PRESENTATION.md 업로드
   - 링크 공유: `https://hackmd.io/@yourname/minecraft-pfp`

---

## 🐛 문제 해결

### Slidev가 Mermaid를 렌더링 안 함
```bash
# 캐시 삭제
rm -rf .slidev
slidev slides.md
```

### Mermaid CLI 설치 오류
```bash
# Puppeteer 의존성 설치 (macOS)
brew install chromium
export PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
npm install -g @mermaid-js/mermaid-cli
```

### 폰트 깨짐
```bash
# 한글 폰트 설치 (Slidev)
# slides.md에 추가:
---
fonts:
  sans: 'Noto Sans KR'
  mono: 'Fira Code'
---
```

---

## 📞 참고 링크

- **Slidev 공식 문서**: https://sli.dev
- **Mermaid 문법**: https://mermaid.js.org
- **Marp 공식**: https://marp.app
- **reveal.js**: https://revealjs.com

---

## ✅ 체크리스트

발표 전 확인사항:

- [ ] Slidev 설치 완료
- [ ] `slidev slides.md` 실행 확인
- [ ] Mermaid 다이어그램 렌더링 확인
- [ ] 발표자 노트 작성 (slides.md에 `<!-- -->` 추가)
- [ ] 타이머 설정 (5분)
- [ ] 백업용 PDF 생성
- [ ] 데모 영상 준비 (1분)

화이팅! 🚀
