# Minecraft Skin Generation - Detailed Multi-Perspective Prompt System

## 마인크래프트 스킨 구조 완벽 가이드

마인크래프트 스킨은 64x64 픽셀 템플릿으로, 3D 캐릭터의 모든 면(전/후/좌/우/상/하)을 2D로 펼쳐놓은 UV 맵입니다. 각 픽셀이 중요하며, 모든 각도에서 일관된 디테일이 필요합니다.

---

## 📐 64x64 템플릿 레이아웃 (정확한 픽셀 좌표)

```
MINECRAFT SKIN TEMPLATE (64x64 pixels)
==========================================

HEAD (First Layer):
- Right side:  (0,8) to (8,16)   [8x8]
- Front face:  (8,8) to (16,16)  [8x8]
- Left side:   (16,8) to (24,16) [8x8]
- Back:        (24,8) to (32,16) [8x8]
- Top:         (8,0) to (16,8)   [8x8]
- Bottom:      (16,0) to (24,8)  [8x8]

HEAD (Second Layer - Hat/Helmet):
- Right side:  (32,8) to (40,16)  [8x8]
- Front face:  (40,8) to (48,16)  [8x8]
- Left side:   (48,8) to (56,16)  [8x8]
- Back:        (56,8) to (64,16)  [8x8]
- Top:         (40,0) to (48,8)   [8x8]
- Bottom:      (48,0) to (56,8)   [8x8]

BODY:
- Right side:  (16,20) to (20,32) [4x12]
- Front:       (20,20) to (28,32) [8x12]
- Left side:   (28,20) to (32,32) [4x12]
- Back:        (32,20) to (40,32) [8x12]
- Top:         (20,16) to (28,20) [8x4]
- Bottom:      (28,16) to (36,20) [8x4]

BODY (Second Layer - Jacket):
- Right side:  (16,36) to (20,48) [4x12]
- Front:       (20,36) to (28,48) [8x12]
- Left side:   (28,36) to (32,48) [4x12]
- Back:        (32,36) to (40,48) [8x12]
- Top:         (20,32) to (28,36) [8x4]
- Bottom:      (28,32) to (36,36) [8x4]

RIGHT ARM:
- Top (outer): (40,16) to (44,20) [4x4]
- Front:       (44,20) to (48,32) [4x12]
- Bottom:      (44,16) to (48,20) [4x4]
- Back:        (52,20) to (56,32) [4x12]
- Right side:  (40,20) to (44,32) [4x12]
- Left side:   (48,20) to (52,32) [4x12]

RIGHT ARM (Second Layer - Sleeve):
- Top (outer): (40,32) to (44,36) [4x4]
- Front:       (44,36) to (48,48) [4x12]
- Bottom:      (44,32) to (48,36) [4x4]
- Back:        (52,36) to (56,48) [4x12]
- Right side:  (40,36) to (44,48) [4x12]
- Left side:   (48,36) to (52,48) [4x12]

LEFT ARM:
- Top (outer): (32,48) to (36,52) [4x4]
- Front:       (36,52) to (40,64) [4x12]
- Bottom:      (36,48) to (40,52) [4x4]
- Back:        (44,52) to (48,64) [4x12]
- Right side:  (32,52) to (36,64) [4x12]
- Left side:   (40,52) to (44,64) [4x12]

LEFT ARM (Second Layer - Sleeve):
- Top (outer): (48,48) to (52,52) [4x4]
- Front:       (52,52) to (56,64) [4x12]
- Bottom:      (52,48) to (56,52) [4x4]
- Back:        (60,52) to (64,64) [4x12]
- Right side:  (48,52) to (52,64) [4x12]
- Left side:   (56,52) to (60,64) [4x12]

RIGHT LEG:
- Top (outer): (0,16) to (4,20)  [4x4]
- Front:       (4,20) to (8,32)  [4x12]
- Bottom:      (4,16) to (8,20)  [4x4]
- Back:        (12,20) to (16,32)[4x12]
- Right side:  (0,20) to (4,32)  [4x12]
- Left side:   (8,20) to (12,32) [4x12]

RIGHT LEG (Second Layer - Pants):
- Top (outer): (0,32) to (4,36)  [4x4]
- Front:       (4,36) to (8,48)  [4x12]
- Bottom:      (4,32) to (8,36)  [4x4]
- Back:        (12,36) to (16,48)[4x12]
- Right side:  (0,36) to (4,48)  [4x12]
- Left side:   (8,36) to (12,48) [4x12]

LEFT LEG:
- Top (outer): (16,48) to (20,52) [4x4]
- Front:       (20,52) to (24,64) [4x12]
- Bottom:      (20,48) to (24,52) [4x4]
- Back:        (28,52) to (32,64) [4x12]
- Right side:  (16,52) to (20,64) [4x12]
- Left side:   (24,52) to (28,64) [4x12]

LEFT LEG (Second Layer - Pants):
- Top (outer): (0,48) to (4,52)   [4x4]
- Front:       (4,52) to (8,64)   [4x12]
- Bottom:      (4,48) to (8,52)   [4x4]
- Back:        (12,52) to (16,64) [4x12]
- Right side:  (0,52) to (4,64)   [4x12]
- Left side:   (8,52) to (12,64)  [4x12]
```

---

## 🎨 완벽한 디테일 프롬프트 템플릿

### Ultra-Detailed Prompt (모든 각도 포함)

```
# MINECRAFT SKIN GENERATION REQUEST - ULTRA DETAILED

Create a 64x64 pixel Minecraft character skin following the exact template layout with perfect pixel-level detail on ALL faces (front, back, left, right, top, bottom).

## WALLET ADDRESS
{ADDRESS}

## CHARACTER TRAITS

### 🎩 HEAD & HAT
**Base Head (First Layer):**
- Skin Tone: {SKIN_TONE} ({SKIN_TONE_DESCRIPTION})
- Skin Shade: {SKIN_SHADE}/50 (brightness variation)
- Base Color: {SKIN_BASE_COLOR}
- Shadow Color: {SKIN_SHADOW_COLOR}
- Highlight Color: {SKIN_HIGHLIGHT_COLOR}

**FRONT FACE (8,8 to 16,16) - 8x8 pixels:**
- Eyes: 2 pixels each, positioned at (10,12) and (14,12)
  - Eye color: Based on address hash
  - White sclera (1 pixel border)
  - Add subtle shine pixel in top-right of each eye
- Nose: Small 1-2 pixel detail at (12,13)
  - Shadow under nose for depth
- Mouth: 3-4 pixel wide smile or neutral expression at (11-14, 14)
  - Slight shadow for lip definition
- Cheeks: Subtle blush/shading at corners
- Overall shading: Light from top-left
  - Top pixels: Lighter (highlight)
  - Bottom pixels: Darker (shadow)
  - Left pixels: Medium-light
  - Right pixels: Medium

**LEFT SIDE (16,8 to 24,16) - 8x8 pixels:**
- Ear: 2x3 pixel detail at (17-18, 11-13)
  - Ear shadow: Darker inner pixel
  - Ear highlight: Lighter outer edge
- Side of eye: Continuation from front (1-2 pixels visible)
- Jawline: Subtle darker pixels at bottom for structure
- Hair (if no hat): Side swept or covering ear partially
- Shading: Consistent with front face lighting

**RIGHT SIDE (0,8 to 8,16) - 8x8 pixels:**
- Mirror of left side but reversed
- Ear: 2x3 pixel detail at (6-7, 11-13)
- Shading: Opposite lighting (darker if left is lighter)
- Maintain symmetry with left side features

**BACK (24,8 to 32,16) - 8x8 pixels:**
- Hair details visible from back
- Neck/head connection shading
- If hair is long: Show hair flow
- Ear tops visible at edges (if applicable)
- Consistent skin tone
- Shadow transition from sides

**TOP (8,0 to 16,8) - 8x8 pixels:**
- Hair whorl or part line
- Natural hair growth pattern
- Shading to show roundness
- Center point or off-center part
- Hair color consistent with hat layer

**BOTTOM (16,0 to 24,8) - 8x8 pixels:**
- Neck connection circle (4-6 pixels diameter)
- Shadow ring around neck hole
- Chin underside shading
- Subtle texture variation

**Hat/Second Layer (32-64, 0-16):**
- Style: {HAT_STYLE} - {HAT_STYLE_DESCRIPTION}
- Color: {HAT_COLOR}
- Opacity: {HAT_OPACITY}/255

**HAT FRONT (40,8 to 48,16) - 8x8 pixels:**
- Hat brim/edge: Clear definition
- Hat material texture: Fabric folds, shine, or pattern
- Logo/emblem (if applicable): 2-4 pixel design
- Shading: Light from top-left
  - Top edge: Highlight
  - Bottom edge: Shadow
  - Rim shadow cast on face (if brimmed hat)
- Stitching details: 1-pixel accent lines

**HAT LEFT SIDE (48,8 to 56,16) - 8x8 pixels:**
- Side profile of hat shape
- Ear coverage (if applicable)
- Strap/band details (if baseball cap/helmet)
- Material texture consistent with front
- Edge definition between hat and head
- Shading gradient matching lighting

**HAT RIGHT SIDE (32,8 to 40,16) - 8x8 pixels:**
- Mirror symmetry with left side
- Consistent texture and details
- Proper shading for right-side lighting

**HAT BACK (56,8 to 64,16) - 8x8 pixels:**
- Back design (if baseball cap: adjustment strap)
- Hat size/fit indication
- Hair peeking out (if applicable)
- Seam lines or construction details
- Logo back (if applicable)

**HAT TOP (40,0 to 48,8) - 8x8 pixels:**
- Top surface view
- Button or center detail (if applicable)
- Panel sections (if baseball cap: 6 panels)
- Ventilation holes (if applicable)
- Center point or logo
- Radial shading from center

**HAT BOTTOM (48,0 to 56,8) - 8x8 pixels:**
- Inner lining texture
- Sweatband (if applicable)
- Size tag detail (if visible)
- Shadow cast by brim
- Inner rim definition

---

### 👕 BODY & CLOTHES
**Base Body (First Layer):**
- Skin tone matching head
- Shading for torso structure

**FRONT (20,20 to 28,32) - 8x12 pixels:**
- Chest/torso definition
- Ribcage subtle suggestion
- Belly button at (23-24, 27)
- Muscle/structure shading
- Light from top-left

**BACK (32,20 to 40,32) - 8x12 pixels:**
- Spine line suggestion (vertical)
- Shoulder blade hints
- Lower back curve
- Symmetrical shading

**LEFT SIDE (28,20 to 32,32) - 4x12 pixels:**
- Ribcage curve
- Waist narrowing
- Armpit connection
- Side muscle definition

**RIGHT SIDE (16,20 to 20,32) - 4x12 pixels:**
- Mirror of left side
- Consistent shading

**TOP (20,16 to 28,20) - 8x4 pixels:**
- Shoulder surfaces
- Collarbone area
- Neck connection hole (center)
- Shoulder curve shading

**BOTTOM (28,16 to 36,20) - 8x4 pixels:**
- Waist/hip connection
- Leg holes (2 circles, 3-4 pixels each)
- Hip bone hints
- Connection shading

**Clothes/Jacket (Second Layer):**
- Style: {CLOTHES_STYLE} - {CLOTHES_STYLE_DESCRIPTION}
- Color: {CLOTHES_COLOR}
- Opacity: {CLOTHES_OPACITY}/255

**CLOTHES FRONT (20,36 to 28,48) - 8x12 pixels:**

FOR T-SHIRT STYLE:
- Collar: V-neck, crew neck, or specific style (top 2-3 rows)
  - Collar edge: Darker outline
  - Collar shadow: Inside neck area
- Chest design/logo: Center placement (4-6 pixels wide)
- Fabric folds: Vertical lines suggesting drape
  - Under arms: Shadow lines
  - Center: Slight fold line
- Hem line: Bottom edge definition (darker line)
- Seam details: Shoulder seams visible
- Texture: Fabric weave pattern (subtle)
  - Cotton: Slight stipple
  - Smooth: Clean solid
- Buttons (if applicable): Vertical line, 3-4 button pixels
- Pocket (if applicable): Top-left chest (3x3 pixels)
  - Pocket outline
  - Pocket shadow
  - Stitching detail

FOR HOODIE STYLE:
- Hood drawstrings: 2 lines from neck
- Kangaroo pocket: Center pouch (4x3 pixels)
  - Pocket opening shadow
  - Hand entry darkness
- Zipper: Center vertical line
  - Zipper teeth: Alternating pixels
  - Zipper pull: Small detail
- Hood shadow: Behind neck

FOR ARMOR STYLE:
- Plate segments: Geometric divisions
- Rivets: Corner detail pixels
- Metallic shine: Highlight pixels
- Edge definition: Strong outlines
- Strap connections: Buckle pixels

FOR JACKET STYLE:
- Lapels: Diagonal fold lines
- Collar: Raised definition
- Buttons: Side or center line
- Pockets: Hip level (2 pockets)
- Zipper or button closure: Center line

**CLOTHES BACK (32,36 to 40,48) - 8x12 pixels:**
- Back seam: Center vertical line
- Shoulder seam: Horizontal top line
- Fabric tension lines: Across shoulders
- Logo/text (if applicable): 4-6 pixel design
- Hem: Bottom edge definition
- Wrinkles: Natural fold patterns
  - Shoulder blade area: Diagonal folds
  - Lower back: Horizontal creases
- Hood (if hoodie): Hood shape draped

**CLOTHES LEFT SIDE (28,36 to 32,48) - 4x12 pixels:**
- Side seam: Vertical line
- Armpit gusset: Triangular detail
- Waist shape: Slight narrowing
- Hem edge: Side view
- Zipper edge (if applicable)
- Pocket edge (if side pockets)

**CLOTHES RIGHT SIDE (16,36 to 20,48) - 4x12 pixels:**
- Symmetrical with left
- Consistent seam details
- Mirror pocket placement

**CLOTHES TOP (20,32 to 28,36) - 8x4 pixels:**
- Shoulder surface
- Collar from above
- Neck opening
- Seam intersections
- Sleeve connections

**CLOTHES BOTTOM (28,32 to 36,36) - 8x4 pixels:**
- Hem edge from below
- Waistband (if applicable)
- Belt loops (if applicable)
- Bottom seam line

---

### 👖 LEGS & PANTS

**Base Legs (First Layer):**
- Skin tone matching body
- Knee definition
- Ankle narrowing

**RIGHT LEG FRONT (4,20 to 8,32) - 4x12 pixels:**
- Thigh: Wider top
- Knee: Middle definition (subtle bump at pixel 26)
- Shin: Straight section
- Ankle: Slight narrowing
- Muscle shadows:
  - Outer thigh: Darker
  - Inner thigh: Lighter
  - Knee cap: Highlight
  - Shin: Center highlight

**LEFT LEG FRONT (20,52 to 24,64) - 4x12 pixels:**
- Mirror right leg
- Consistent anatomy
- Symmetrical shading

**BACK LEGS:**
- Calf muscle: Rounder shape
- Hamstring: Upper back thickness
- Ankle: Achilles indent
- Shadow between legs

**Pants (Second Layer):**
- Style: {PANTS_STYLE} - {PANTS_STYLE_DESCRIPTION}
- Color: {PANTS_COLOR}
- Opacity: {PANTS_OPACITY}/255

**PANTS FRONT RIGHT (4,36 to 8,48) - 4x12 pixels:**

FOR JEANS:
- Waistband: Top 1-2 pixels, darker
- Belt loops: Small rectangles (1 pixel each)
- Fly: Center vertical seam
- Pockets: Side and back hints
  - Front pocket: Diagonal opening (top-right)
  - Rivet: Corner pixel detail
- Knee wear: Lighter pixels at knee area
- Hem: Bottom cuff or frayed edge
- Seams:
  - Outer seam: Vertical line (right edge)
  - Inner seam: Vertical line (left edge)
  - Double stitching: Parallel lines (1 pixel apart)
- Texture: Denim weave (subtle diagonal pattern)
- Folds:
  - Knee crease: Horizontal lines at knee
  - Thigh creases: Diagonal from pocket
  - Ankle bunching: Horizontal lines at bottom

FOR SHORTS:
- Hem: Mid-thigh (around pixel 26)
- Frayed edge or cuff
- Longer inseam visible

FOR FORMAL PANTS:
- Crease: Center vertical line (sharp)
- Smooth texture: No denim pattern
- Clean hem: Pressed edge
- Subtle sheen: Highlight pixels

FOR SWEATPANTS:
- Elastic waistband: Top band (2 pixels)
- Drawstring: Small detail
- Loose fit: Less form-fitting
- Elastic cuffs: Bottom band (if applicable)
- Soft texture: No harsh seams

FOR ARMOR LEGGINGS:
- Plate segments: Horizontal divisions
- Knee guard: Prominent protection
- Rivets and straps: Detail pixels
- Metallic texture: Highlights and shadows

**PANTS BACK RIGHT (12,36 to 16,48) - 4x12 pixels:**
- Back pocket: Square outline (3x3 pixels)
  - Stitching: Outline detail
  - Logo patch: Small design (if applicable)
- Back seam: Center vertical
- Seat area: Slight curve
- Hem: Back view

**PANTS SIDES (0,36-4,48 & 8,36-12,48) - 4x12 pixels each:**
- Outer seam: Clear vertical line
- Inner seam: Leg separation
- Side pocket opening (if cargo pants)
- Belt loops visible from side

**PANTS TOP (4,32 to 8,36) - 4x4 pixels:**
- Waistband from above
- Belt (if applicable): Buckle detail
- Button closure: Center pixel
- Waist opening: Connection to body

**PANTS BOTTOM (4,48 to 8,52) - 4x4 pixels:**
- Leg opening: Ankle hole
- Hem edge: Cuff or raw edge
- Shoe entry point

---

### 👟 SHOES

**Base Feet (First Layer):**
- Skin tone (if visible)
- Toe definition
- Ankle bone

**Shoes (Second Layer):**
- Style: {SHOES_STYLE} - {SHOES_STYLE_DESCRIPTION}
- Color: {SHOES_COLOR}
- Opacity: {SHOES_OPACITY}/255

**RIGHT SHOE FRONT (4,36 to 8,48) - 4x12 pixels (lower portion):**

FOR SNEAKERS:
- Toe box: Rounded front (pixels 44-48)
  - Toe cap: Lighter or contrasting color
  - Toe stitching: Detail line
- Laces: Diagonal crisscross pattern
  - Lace holes: 4-6 pairs (dark pixels)
  - Lace crossing: Lighter pixels
  - Bow at top: Small detail
- Tongue: Center rectangle behind laces
  - Tongue padding: Slightly lighter
  - Brand tab: Tiny detail pixel
- Side panels: Color blocking
  - Nike swoosh area (if styled)
  - Adidas stripes area (if styled)
  - Contrast stitching: Outline
- Sole:
  - Midsole: White or contrasting band (2-3 pixels high)
  - Outsole: Bottom row, darker
  - Sole curve: Following foot shape
- Ankle collar: Top padding (1-2 pixels)
- Heel counter: Reinforced back area

FOR BOOTS:
- Shaft: Taller coverage (8-10 pixels)
- Laces: More lace holes
- Tongue: Longer, padded
- Toe: More squared or rounded
- Sole: Thicker, more pronounced
  - Tread pattern: Bottom texture
  - Heel: Slight raise
- Leather texture: Subtle grain
- Stitching: More visible seams
- Buckles/straps (if applicable): Detail pixels

FOR SANDALS:
- Straps: Minimal coverage
  - Toe strap: Across front
  - Ankle strap: Around back
  - Buckle: Small detail
- Sole: Flat, thin (1-2 pixels)
- Toe separation: Visible toes
- Footbed: Slight texture

FOR DRESS SHOES:
- Polished surface: More highlights
- Clean lines: Minimal stitching
- Pointed or rounded toe: Shape definition
- Laces: Thin, tight
- Sole: Thin, dark
- Shine: Highlight pixels on toe and side

FOR ARMOR BOOTS:
- Plate coverage: Segmented armor
  - Toe plate: Protective front
  - Shin guard: Front vertical plate
  - Ankle protection: Side plates
- Rivets: Corner details
- Straps: Buckle connections
- Metallic texture: Highlights
- Chainmail (if applicable): Under plates

**SHOE SIDES (0,36-4,48 & 8,36-12,48):**
- Side profile view
- Brand logo area (if applicable)
- Side stitching: Seam lines
- Arch support: Indent shape
- Heel height: Visible elevation
- Ankle curve: Natural foot shape

**SHOE BACK (12,36 to 16,48):**
- Heel counter: Back reinforcement
- Heel pull tab: Small rectangle
- Achilles notch: Indent at ankle
- Back stitching: Center seam
- Brand detail: Small logo

**SHOE TOP (4,32 to 8,36):**
- Lace view from above
- Tongue center
- Ankle opening: Oval shape
- Padding view: Collar thickness

**SHOE BOTTOM (4,48 to 8,52):**
- Sole pattern: Tread design
  - Running shoe: Waffle or pod pattern
  - Boot: Deep lug pattern
  - Dress shoe: Smooth or minimal
- Arch area: Indent
- Heel area: Thicker section
- Pivot point: Ball of foot detail

---

### 💪 ARMS

**RIGHT ARM FRONT (44,20 to 48,32) - 4x12 pixels:**
- Shoulder: Wider top (pixels 20-22)
- Bicep: Middle section (pixels 23-26)
- Elbow: Joint at pixel 27
- Forearm: Narrowing (pixels 28-30)
- Wrist: Narrowest (pixels 31-32)
- Muscle definition:
  - Bicep bulge: Outer side
  - Tricep: Inner side (if visible)
  - Forearm muscles: Subtle lines
- Skin shading:
  - Top-left light source
  - Bottom-right shadows
- Hand connection: Wrist detail

**RIGHT ARM BACK (52,20 to 56,32) - 4x12 pixels:**
- Tricep visibility
- Elbow point: More prominent
- Forearm back: Smoother
- Wrist back: Knobby detail

**RIGHT ARM SIDES (40,20-44,32 & 48,20-52,32):**
- Arm roundness
- Muscle bulk: Outer side thicker
- Inner arm: Smoother
- Elbow: Side bump

**LEFT ARM (Mirror right arm):**
- All details mirrored
- Consistent anatomy
- Symmetrical shading

**ARM SLEEVES (Second Layer):**

FOR SHORT SLEEVES:
- Sleeve hem: Mid-bicep (pixel 25-26)
- Arm hole: Sleeve connection to body
- Hem stitching: Edge detail
- Fabric roll: Slight cuff
- Shoulder seam: Visible connection

FOR LONG SLEEVES:
- Full coverage to wrist
- Elbow area: Fabric bunching
  - Elbow crease: Horizontal lines
  - Push-up effect (if applicable): Bunched fabric
- Cuff: Wrist band (2 pixels)
  - Button detail: Small pixel
  - Cuff fold: Edge definition
- Sleeve seam: Underarm line

FOR JACKET SLEEVES:
- Thicker material: More structured
- Less form-fitting: Straighter lines
- Cuff: More prominent (2-3 pixels)
- Seam details: Visible stitching
- Layering visible: Over shirt

FOR ARMOR ARM GUARDS:
- Pauldron: Shoulder protection (top 4 pixels)
  - Plate shape: Curved coverage
  - Rivets: Corner details
  - Strap connections: Buckles
- Vambrace: Forearm guard (lower 6 pixels)
  - Segmented plates: Horizontal divisions
  - Elbow joint: Articulation gap
  - Straps: Wrap-around details

---

### 🤲 SPECIAL ITEM HOLDING

**Item: {SPECIAL_ITEM_NAME}**
**Wealth Tier: {WEALTH_TIER}**

The special item should be held in the RIGHT HAND and drawn on both the right arm texture and visible in the 3D space.

**WOODEN SWORD (Bronze Tier):**
Position: Right arm front (44,20 to 48,32) - overlapping hand area
- Handle: Brown/tan (3 pixels tall at wrist)
  - Grip wrapping: Spiral lines
  - Pommel: End cap (1 pixel)
- Guard: Dark brown cross (2 pixels wide)
- Blade: Light wood grain (8-10 pixels long)
  - Wood grain: Vertical lines
  - Edge: Slightly darker outline
  - Tip: Pointed (2 pixels taper)
- Shading: Simple, flat look
- No glow effect
- Visible on: Right arm front, right arm right side

**STEEL SWORD (Silver Tier):**
Position: Right arm, extending beyond arm texture
- Handle: Dark gray/black (3 pixels)
  - Leather wrap: Texture lines
  - Pommel: Round end
- Guard: Steel cross (3 pixels wide)
  - Metallic sheen: Highlight pixel
- Blade: Silver/gray (12-14 pixels)
  - Fuller: Center groove line
  - Edges: Sharp outline
  - Tip: Sharp point
- Glow effect: Subtle silver shimmer (#C0C0C0)
  - Edge pixels: Lighter silver
  - Shine pixels: White highlights (2-3 pixels)
- Visible on: Right arm front, extends into background

**GOLDEN SWORD (Gold Tier):**
Position: Right arm, prominent display
- Handle: Dark brown (3 pixels)
  - Gold pommel: Ornate end
- Guard: Gold (4 pixels wide)
  - Decorative curves: Ornate design
- Blade: Gold (14-16 pixels)
  - Engraving: Pattern lines
  - Shine: Multiple highlight pixels
  - Edge: Sharp, defined
- Glow effect: Strong gold aura (#FFD700)
  - Blade outline: Bright gold pixels
  - Glow radius: 1-2 pixels beyond blade
  - Shimmer: Alternating bright pixels
- Particle suggestions: Small gold sparkles (2-3 pixels)
  - Around blade
  - Random positions
- Visible on: Right arm, background, slight glow on body

**DIAMOND SWORD (Platinum Tier):**
Position: Right arm, very prominent
- Handle: Black/obsidian (4 pixels)
  - Gem pommel: Small diamond pixel
  - Grip detail: Intricate wrapping
- Guard: Diamond/cyan (5 pixels wide)
  - Crystalline edges: Angular design
  - Multi-faceted: Multiple color values
- Blade: Cyan/turquoise (16-18 pixels)
  - Crystal structure: Internal lines
  - Facets: Angular highlights
  - Prismatic edge: Color variation
- Glow effect: Intense cyan (#00FFFF)
  - Bright core: Pure cyan
  - Glow radius: 2-3 pixels
  - Color gradient: Cyan to white
- Particle effects: Cyan sparkles (4-6 pixels)
  - Around entire sword
  - Animated suggestion (different frames)
  - Trailing effect: Motion blur pixels
- Magic shimmer: Additional white pixels
- Visible on: Right arm, background, glow affects nearby pixels

**LEGENDARY BLADE (Diamond Tier):**
Position: Right arm, most prominent
- Handle: Obsidian black (5 pixels)
  - Ancient runes: Glowing symbols (1-2 pixels)
  - Gem pommel: Large magenta pixel
  - Ornate guard: Complex design
- Guard: Multi-metal (6 pixels wide)
  - Black and magenta: Color alternation
  - Decorative wings: Side extensions
  - Gem inlays: Small colored pixels
- Blade: Gradient (20-22 pixels)
  - Base: Deep purple
  - Middle: Magenta
  - Tip: Pink
  - Energy lines: Running along blade
  - Cosmic pattern: Starfield texture (tiny pixels)
- Glow effect: Intense rainbow aura
  - Primary: Magenta/pink (#FF1493)
  - Secondary: Purple (#9333EA)
  - Tertiary: Cyan accents
  - Glow radius: 3-4 pixels
  - Multi-layer glow: Different color rings
- Particle effects: Heavy (8-10 pixels)
  - Pink sparkles: Main particles
  - Purple trails: Motion effects
  - Cyan accents: Contrast particles
  - Star bursts: Occasional bright pixels
  - Energy wisps: Flowing lines
- Aura effect: Rainbow gradient
  - Surrounding character: 2-pixel radius
  - Color shift: Cycling colors
  - Intensity: Pulsing suggestion
- Visible on: All surfaces, strong glow affecting entire character

**SPECIAL ITEM ACCESSORIES (Non-Weapon):**

**CROWN (Gold/Platinum/Diamond):**
Position: On head layer (HAT layer)
- Band: Circling head (full perimeter)
  - Thickness: 2 pixels tall
  - Material: Gold/platinum/diamond color
  - Gems: Inset colored pixels
- Points: 5-7 peaks
  - Peak height: 3-4 pixels above band
  - Peak width: 2 pixels at base, 1 at top
  - Decorative tips: Cross or orb finials
- Jewels: Center front and on points
  - Large center gem: 2x2 pixels
  - Point gems: 1 pixel each
  - Colors: Ruby, sapphire, emerald
  - Shine: White highlight pixels
- Filigree: Decorative patterns
  - Between points: Swirl designs
  - Band detail: Ornate lines
- Glow (if high tier): Aura around crown
- Visible on: All head views, top view shows full circle

**WINGS (Gold/Platinum/Diamond):**
Position: Back of body, attached to shoulders
- Attachment: Shoulder blades (pixels 24-26 on back)
- Wing span: 8-12 pixels wide (extending beyond body)
- Feather detail:
  - Primary feathers: Longest (8 pixels)
  - Secondary feathers: Medium (6 pixels)
  - Coverts: Small, overlapping (4 pixels)
- Feather texture:
  - Shaft: Center line each feather
  - Barbs: Side details
  - Layering: Overlapping pattern
- Color: White/gold/angel glow
- Movement suggestion: Slight curve
- Glow effect (if high tier):
  - Feather edges: Bright outline
  - Glow radius: 1-2 pixels
  - Particle trail: Floating feathers (2-3 pixels)
- Visible on: Back (prominent), sides (partial), front (wing tips)

**CAPE/CLOAK (Silver/Gold):**
Position: Back and shoulders
- Collar: Shoulder drape (top 2 pixels on body back)
  - Clasp: Center front neck
  - Chain/brooch: Connection detail
- Drape: Hanging down back (10-12 pixels length)
  - Fold lines: Vertical creases
  - Movement: Slight billow suggestion
  - Hem: Bottom edge (curved or straight)
- Material texture:
  - Velvet: Deep color, soft shading
  - Silk: Shiny highlights
  - Wool: Matte, textured
- Interior lining (if visible): Contrasting color
- Emblem/crest (if applicable): 4x4 pixel design on back
- Visible on: Back (full), sides (edges), front (collar only)

---

## 🎯 CRITICAL PIXEL-PERFECT REQUIREMENTS

### Lighting & Shading Rules
1. **Light Source Position:** Top-left at 45° angle
   - Top pixels: +20% brightness
   - Left pixels: +10% brightness
   - Bottom pixels: -20% brightness
   - Right pixels: -10% brightness

2. **Shadow Casting:**
   - Hat shadow on face: 1-2 pixels darker below brim
   - Arm shadow on body: Side pixels darker
   - Leg shadow: Between legs, darker pixels
   - Nose shadow: Diagonal down-right (1 pixel)
   - Under-chin shadow: Bottom face pixels

3. **Highlight Placement:**
   - Top of head: Brightest pixels
   - Shoulder tops: Highlight row
   - Knee caps: Single bright pixel
   - Nose bridge: Vertical highlight line (2 pixels)
   - Cheekbones: Side highlights

### Color Consistency Rules
1. **Base Color:** {PRIMARY_COLOR}
   - Shadow: Darken by 30-40%
   - Highlight: Lighten by 20-30%
   - Mid-tone: Base color

2. **Color Harmony:**
   - Adjacent faces: Maximum 20% brightness difference
   - Gradients: Smooth transitions (3-4 steps)
   - No single-pixel color islands (unless detail like eyes)

3. **Opacity Handling:**
   - If opacity < 200: Blend with underlying layer
   - Show underlying details through transparent areas
   - Edge pixels: Use alpha for smooth edges

### Texture & Detail Rules
1. **Fabric Textures:**
   - Cotton: Matte, subtle stipple (10% of pixels varied)
   - Denim: Diagonal weave (2-pixel diagonal pattern)
   - Leather: Grain lines, slight shine
   - Silk: High contrast highlights (50% brighter spots)
   - Wool: Fuzzy edges (anti-aliased outlines)

2. **Material Textures:**
   - Metal: High contrast (70% highlights)
   - Wood: Grain lines (vertical/horizontal)
   - Stone: Irregular pixel variation (20%)
   - Glass: Transparency, sharp highlights
   - Cloth: Soft shading, fold lines

3. **Detail Density:**
   - 8x8 faces (head): 5-8 detail pixels
   - 4x12 limbs: 3-5 detail pixels per section
   - 8x12 body: 8-12 detail pixels
   - Keep 40-60% solid color for clarity

### Anatomical Proportion Rules
1. **Head:** 8x8x8 cube (perfect)
2. **Body:** 8 wide, 12 tall, 4 deep
3. **Arms:** 4x12x4 each (symmetrical)
4. **Legs:** 4x12x4 each (symmetrical)
5. **Ratios:**
   - Head to body: 1:1.5
   - Arm to leg: 1:1
   - Shoulder width: 8 pixels (= head width)

### Symmetry Rules
1. **Bilateral Symmetry:**
   - Left and right sides: Mirror unless asymmetric design
   - Eyes: Same size, same vertical position
   - Arms: Identical except item holding
   - Legs: Perfect mirrors

2. **Asymmetric Elements:**
   - Item holding: Only right hand
   - Logo placement: Specific position (not centered)
   - Battle damage: Realistic placement
   - Accessories: Style choice

### Edge Definition Rules
1. **Hard Edges:** (1-pixel transitions)
   - Clothing seams
   - Armor plates
   - Shoe soles
   - Hat brims

2. **Soft Edges:** (2-3 pixel gradients)
   - Skin shading
   - Fabric folds
   - Rounded surfaces
   - Organic shapes

3. **No Edge:** (blended)
   - Skin tone transitions
   - Gradient backgrounds
   - Glow effects
   - Atmospheric effects

---

## 🌈 COLOR PALETTE GENERATION

Based on the trait color family, generate exact hex values for all variants:

### {COLOR_FAMILY} Palette:

**Primary:** {BASE_COLOR}
**Shadow:** {SHADOW_COLOR} (30% darker)
**Highlight:** {HIGHLIGHT_COLOR} (20% lighter)
**Accent:** {ACCENT_COLOR} (complementary)

**Gradient Steps (for smooth shading):**
1. Deepest shadow: {SHADOW_COLOR_DEEP}
2. Shadow: {SHADOW_COLOR}
3. Mid-shadow: {MID_SHADOW_COLOR}
4. Base: {BASE_COLOR}
5. Mid-highlight: {MID_HIGHLIGHT_COLOR}
6. Highlight: {HIGHLIGHT_COLOR}
7. Brightest highlight: {HIGHLIGHT_COLOR_BRIGHT}

### Special Effects Colors:
**Glow Color:** {GLOW_COLOR} (based on wealth tier)
**Particle Color:** {PARTICLE_COLOR}
**Aura Color:** {AURA_COLOR}

---

## 📊 PIXEL MAPPING CHECKLIST

Before finalizing, verify ALL of these pixels are correctly placed:

### Head (64 pixels total per face)
- [ ] Front face: Eyes (4 pixels), nose (2 pixels), mouth (4 pixels)
- [ ] Left side: Ear (6 pixels), eye edge (2 pixels)
- [ ] Right side: Ear (6 pixels), eye edge (2 pixels)
- [ ] Back: Hair (20+ pixels), neck (10 pixels)
- [ ] Top: Hair whorl (30+ pixels), part line
- [ ] Bottom: Neck hole (20 pixels), chin shadow

### Hat Layer (64 pixels total per face)
- [ ] Front: Brim/edge (10 pixels), logo (8 pixels), details (15 pixels)
- [ ] Sides: Profile (25 pixels each), band (6 pixels)
- [ ] Back: Back design (20 pixels), closure (8 pixels)
- [ ] Top: Top view (40 pixels), button/center (8 pixels)
- [ ] Bottom: Lining (30 pixels), band (12 pixels)

### Body (96 pixels front, 48 sides, 32 top/bottom)
- [ ] Front: Chest (40 pixels), belly (30 pixels), belly button (2 pixels)
- [ ] Back: Spine (12 pixels), shoulder blades (20 pixels)
- [ ] Sides: Ribs (15 pixels each), waist curve
- [ ] Top: Shoulders (40 pixels), collar bones (12 pixels)
- [ ] Bottom: Hip connection (24 pixels), leg holes (16 pixels)

### Clothes Layer
- [ ] Front: Collar (15 pixels), design (25 pixels), seams (10 pixels), hem (8 pixels)
- [ ] Back: Seam (12 pixels), logo (20 pixels if applicable)
- [ ] Sides: Side seam (12 pixels each), gusset (6 pixels)

### Arms (48 pixels per arm)
- [ ] Front: Shoulder (12 pixels), bicep (16 pixels), forearm (16 pixels), wrist (4 pixels)
- [ ] Back: Tricep (16 pixels), elbow (8 pixels), forearm back (16 pixels)
- [ ] Sides: Arm curve (48 pixels total)

### Sleeves
- [ ] Short: Hem (8 pixels), armhole (12 pixels)
- [ ] Long: Full coverage (48 pixels), cuff (8 pixels), elbow crease (12 pixels)

### Legs (48 pixels per leg)
- [ ] Front: Thigh (20 pixels), knee (8 pixels), shin (16 pixels), ankle (4 pixels)
- [ ] Back: Hamstring (20 pixels), calf (20 pixels), achilles (8 pixels)
- [ ] Sides: Leg curve (48 pixels total)

### Pants
- [ ] Front: Waistband (4 pixels), fly (6 pixels), pockets (12 pixels), seams (8 pixels), hem (4 pixels)
- [ ] Back: Back pocket (9 pixels), back seam (12 pixels)
- [ ] Sides: Outer seam (12 pixels each)

### Shoes (Last 16 pixels of each leg)
- [ ] Front: Toe box (8 pixels), laces (12 pixels), tongue (6 pixels), sole (4 pixels)
- [ ] Sides: Profile (16 pixels), logo area (6 pixels)
- [ ] Back: Heel (8 pixels), tab (4 pixels)
- [ ] Bottom: Tread pattern (12 pixels), arch (4 pixels)

### Special Item
- [ ] Handle/grip (8-12 pixels)
- [ ] Guard/connector (4-8 pixels)
- [ ] Main element (20-60 pixels depending on item)
- [ ] Glow effect (10-30 pixels if applicable)
- [ ] Particles (5-15 pixels if applicable)
- [ ] Aura (20-40 pixels if high tier)

---

## 🎨 FINAL OUTPUT REQUIREMENTS

1. **File Format:** PNG with transparency
2. **Dimensions:** Exactly 64x64 pixels
3. **Color Mode:** RGBA (32-bit)
4. **No Anti-aliasing:** Pure pixel art (except glow effects)
5. **Template Compliance:** Perfect match to Minecraft skin template
6. **All Faces Detailed:** Every single face has appropriate detail
7. **Consistent Style:** All pixels work together as cohesive character
8. **Symmetry Verified:** Mirror elements are perfect mirrors
9. **Lighting Consistent:** All faces follow same light source
10. **Special Item Integrated:** Item naturally held/worn by character

---

## 💎 TIER-SPECIFIC ENHANCEMENT REQUIREMENTS

### Bronze Tier ($1,000 - $9,999):
- Basic detail level
- Simple special item
- No glow effects
- Clean, starter aesthetic
- 2-3 color palette per garment
- Minimal accessories

### Silver Tier ($10,000 - $49,999):
- Moderate detail level
- Metallic special item
- Subtle glow (1-pixel outline)
- Refined aesthetic
- 3-4 color palette per garment
- Some decorative details

### Gold Tier ($50,000 - $99,999):
- High detail level
- Premium special item
- Noticeable glow (2-pixel radius)
- Luxurious aesthetic
- 4-5 color palette per garment
- Multiple accessories possible
- Shine/shimmer effects

### Platinum Tier ($100,000 - $499,999):
- Very high detail level
- Exceptional special item
- Strong glow (3-pixel radius)
- Elite aesthetic
- 5-6 color palette per garment
- Particle effects (5-8 particles)
- Animated effect suggestions
- Premium materials

### Diamond Tier ($500,000+):
- Maximum detail level
- Legendary special item
- Intense glow (4+ pixel radius)
- God-tier aesthetic
- Full color palette (6-8 colors)
- Heavy particle effects (10+ particles)
- Aura effects (full character)
- Multiple effect layers
- Cosmic/divine elements
- Best materials and finishes

---

## 🔍 QUALITY VERIFICATION CHECKLIST

Before submitting, verify:

- [ ] Template dimensions: 64x64 pixels exactly
- [ ] All 6 faces of head drawn
- [ ] All 6 faces of hat/helmet drawn
- [ ] All 6 faces of body drawn
- [ ] All 6 faces of jacket/clothes drawn
- [ ] All 6 faces of right arm drawn
- [ ] All 6 faces of right sleeve drawn
- [ ] All 6 faces of left arm drawn
- [ ] All 6 faces of left sleeve drawn
- [ ] All 6 faces of right leg drawn
- [ ] All 6 faces of right pants drawn
- [ ] All 6 faces of left leg drawn
- [ ] All 6 faces of left pants drawn
- [ ] Shoes drawn on all visible faces
- [ ] Special item properly positioned
- [ ] Special item visible from multiple angles
- [ ] Lighting consistent across all faces
- [ ] Colors match specified palette
- [ ] Opacity applied correctly
- [ ] Symmetry maintained where required
- [ ] Asymmetry intentional where present
- [ ] No single-pixel errors
- [ ] All seams align correctly
- [ ] Texture patterns consistent
- [ ] Shading gradients smooth
- [ ] Details clear at 64x64 size
- [ ] Upscales well (test at 512x512)
- [ ] Works in 3D when wrapped
- [ ] All tier requirements met
- [ ] Special effects properly implemented
- [ ] File format correct (PNG, RGBA)
- [ ] Transparency where needed
- [ ] No color bleeding
- [ ] Crisp pixel edges (no blur except glows)

---

This is the complete, ultra-detailed prompt system for generating perfect Minecraft skins with full detail on every face and angle. Every pixel matters!
