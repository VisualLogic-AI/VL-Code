<\!-- VL_SYNTAX_VERSION:2.10 -->
# VL Syntax Reference Complete Version (Rules & Widgets)

## Version Declaration

```vl
// VL_VERSION: version_number
```

This version declaration must be placed in the first line comment of all files to ensure the parser uses the correct version rules.

Current version: `// VL_VERSION:2.10`

Note: The version declaration is not a VL code section; please use `//` instead of `#`.

## File Types and Structure

### Project File Tree Structure:

```
Workspace/
├─ Services/              # ServiceDomain files (service domain definitions, callable from Section)
│   ├─ Catalog.vs
│   └─ Order.vs
├─ Database/              # Database files (database structure definitions)
│   └─ MyProject.vdb
├─ Sections/              # Section files (frontend view modules, can only be used in App)
│   ├─ NavHeader.sc
│   ├─ UserProfile.sc
│   ├─ ProductCard.sc
│   └─ OrderList.sc
├─ ExtComponents/         # Component files (internal encapsulated components, usable in Section/App)
│   ├─ InputField.cp
│   └─ DataAuth.cp
├─ Theme/                 # Theme files (Design Tokens, Coordinate Values, Overrides; one Theme file per project)
│   └─ MyProject.vth
└─ Apps/                  # App files (one file per application)
    ├─ ShopApp.vx
    └─ AdminApp.vx
```

All files participate in the final project code compilation.

### File Cross-References

VL code files support a certain degree of cross-referencing. Please strictly follow these rules:

|                             | App | Section | ServiceDomain | Component |
| --------------------------- | --- | ------- | ------------- | --------- |
| App can reference           | ❌  | ✅      | ❌            | ✅        |
| Section can reference       | ❌  | ❌      | ✅            | ✅        |
| Component can reference     | ❌  | ❌      | ❌            | ❌        |
| ServiceDomain can reference | ❌  | ❌      | ❌            | ❌        |

### File Sections and Structure Examples

VL files follow strict section division. **All sections must appear in order and only once**; otherwise compilation will fail.

#### 1. `.vx` — App (Application Entry)

**Core Responsibilities**: Route management, Section orchestration, cross-module coordination

**Required Sections**: `# SysConfig`, `# Frontend Tree`, `# Frontend Event Handlers`

```vl
// VL_VERSION:2.8
<App-ShopApp "root">

# SysConfig
DEVICE_TARGET:"PC"
SCREEN_RESOLUTION:"1920x1080"

# Frontend Global Vars
$currentKeyword(STRING) = ""
$selectedProductId(INT) = 0

# Frontend Tree
<Page-Home "homePage"> path:"home"
-<Row-Layout> gap:"16px"
--<Section-Sidebar "sidebar"> flex:"0 0 240px"
--<Col-MainArea> flex:"1"
---<Section-SearchBar "searchBar"> width:100% height:"64px"
---<Section-ProductList "productList"> flex:"1" margin-top:"16px"

# Frontend Event Handlers
<Section-SearchBar "searchBar">.@searchSubmit(keyword)
-$currentKeyword = keyword
-<Section-ProductList "productList">.RefreshWithKeyword(keyword)

<Section-ProductList "productList">.@productSelected(productId)
-$selectedProductId = productId
-<ClientUtils>.switchRoute("product-detail")

# Frontend Internal Methods
# Frontend Pipeline Funcs
</App-ShopApp>
```

**Layout Control Examples**: Header `flex:"0 0 64px"`, Sidebar `flex:"0 0 240px"`, Main `flex:"1"`

#### 2. `.sc` — Section (Business Module)

**Core Responsibilities**: Business logic, data interaction, ServiceDomain calls

**Required Sections**: `# Frontend Tree`, `# Frontend Event Handlers`

```vl
// VL_VERSION:2.8
// Preview: width:100% min-height:400px
<Section-ProductList "root"> padding:--spacing24

# Frontend Public Props
$categoryId(INT) = 0

# Frontend Public Events
EVENT @productSelected(productId(INT))

# Frontend Public Methods
METHOD_PUB RefreshWithKeyword(keyword(STRING)); RETURN {success:BOOL}
-$searchKeyword = keyword
-loadProducts() -> _result
-RETURN {success:_result.success}

# Frontend Global Vars
$products([{id:INT,name:STRING,price:FLOAT,image:STRING}]) = []
$searchKeyword(STRING) = ""
$isLoading(BOOL) = false

# Frontend Tree
<ServiceDomain-Product "productService">
-<Service-GetProducts> params:(categoryId(INT),keyword(STRING)) returns:(success(BOOL),data([{}]))

<Col-ListContainer> gap:"16px"
-<If-Loading> conditions:$isLoading
--<Component-LoadingSpinner "spinner">
-<If-HasProducts> conditions:($products.length > 0)
--<For-Products> sourceArray:$products loopVar:[_item0,_index0]
---<Component-ProductCard "card"> product:_item0 width:"280px"
-<If-Empty> conditions:($products.length == 0 && !$isLoading)
--<Component-EmptyState "emptyState"> message:"No products found"

# Frontend Event Handlers
<Component-ProductCard "card">.@cardClick(productId)
-@productSelected(productId)

# Frontend Internal Methods
METHOD loadProducts(); RETURN {success:BOOL}
-$isLoading = true
-<ServiceDomain-Product "productService">.GetProducts($categoryId, $searchKeyword) -> _result
-$isLoading = false
-IF !_result.success
--RETURN {success:false}
-$products = _result.data
-RETURN {success:true}

# Frontend Pipeline Funcs
</Section-ProductList>
```

#### 3. `.cp` — Component (Pure UI Component)

**Core Responsibilities**: Pure UI display, reusable components, no business logic

**Required Sections**: `# Frontend Tree`, `# Frontend Event Handlers`

```vl
// VL_VERSION:2.8
// Preview: width:280px height:360px
<Component-ProductCard "root"> padding:--spacing16

# Frontend Public Props
$product({id:INT,name:STRING,price:FLOAT,image:STRING}) = {id:0,name:"",price:0,image:""}

# Frontend Public Events
EVENT @cardClick(productId(INT))

# Frontend Derived Vars
$formattedPrice(STRING) = ("¥" + $product.price.toFixed(2))

# Frontend Tree
<Col-CardContent> gap:"12px"
-<Image-ProductImage "thumb"> sourceUri:$product.image width:100% height:"200px"
-<Text-ProductName "title"> value:$product.name
-<Text-ProductPrice "price"> value:$formattedPrice

# Frontend Event Handlers
<Col-CardContent>.@click()
-@cardClick($product.id)

# Frontend Internal Methods
# Frontend Pipeline Funcs
</Component-ProductCard>
```

**Key Differences**:

- App controls Section position and size (`width:100%`, `flex:"1"`)
- Section handles business logic and data loading, using Components internally
- Component only handles UI display, receives data via Props, communicates via Events

#### 4. `.vs` — ServiceDomain (Backend Service Domain)

**Required Sections**: `# Backend Tree`, `# Services`. Optional section: `# Backend Environment Vars` (before `# Backend Tree`).

```vl
// VL_VERSION:2.8
<ServiceDomain-Doc>

# Backend Environment Vars
ENV SOME_API_KEY(STRING) "External API key"

# Backend Tree
<VirtualTable-DocList "docTable"> sourceTable:Documents
-<Field-title> type:STRING
-<Field-content> type:STRING

# Services
SERVICE GetDocList();RETURN {success:BOOL,data:[{}]}
-<VirtualTable-DocList "docTable">.select(null,[["_update","desc"]],[0,100]) -> _r
-RETURN {success:true,data:_r.dataArray}

# Backend Event Handlers
# Transactions
# Backend Internal Methods
# Backend Pipeline Funcs
</ServiceDomain-Doc>
```

#### 5. `.vdb` — Database (Database Structure)

```vl
// VL_VERSION:2.8
<Database-ProjectName>
<Table-Documents> data:[{"_id":1,"title":"Doc1","_create":"2024-01-15 09:30:00"}]
-<Field-title> type:STRING notNull:true
-<Field-content> type:STRING
-<Index-TitleIdx> type:UNIQUE fields:["title"]
<Relation-User&Docs> users._id<<documents._user
</Database-ProjectName>
```

#### 6. `.vth` — Theme (Theme Configuration)

**Rules**: Singleton file. Token names follow "only add, never modify or delete" stability principle. File structure is four sections (fixed order): Meta (optional), Design Tokens, Coordinate Values, and Overrides.

```vl
// VL_VERSION:2.10
<Theme-ProjectName>

# Meta
mode:"light"

# Design Tokens
<Color-Brand> colorBrandPrimary:#0052D9 colorBrandPrimaryHover:#366EF4 colorBrandPrimaryActive:#0034B5
<Color-Bg> colorBgBody:#FFFFFF colorBgDisabled:#F5F5F5
<Color-Text> colorTextPrimary:#1D2129 colorTextSecondary:#4E5969 colorTextDisabled:#C9CDD4 colorTextInverse:#FFFFFF
<Color-Status> colorSuccess:#00B42A colorWarning:#FF7D00 colorError:#F53F3F
<Color-Border> colorBorder:#E5E6EB colorBorderHover:#C9CDD4
<Radius-Base> radiusSm:2px radiusMd:4px radiusLg:8px
<Spacing-Base> spacing2:2px spacing4:4px spacing6:6px spacing8:8px spacing12:12px spacing16:16px spacing24:24px
<Font-Base> fontSizeSm:12px fontSizeMd:14px fontSizeLg:16px fontFamily:"Inter, system-ui, sans-serif"
<Shadow-Base> shadowSm:0 1px 2px rgba(0,0,0,0.05) shadowMd:0 4px 12px rgba(0,0,0,0.08) shadowLg:0 8px 24px rgba(0,0,0,0.12)
<Shadow-Focus> shadowFocusPrimary:0 0 0 2px rgba(0,82,217,0.2) shadowFocusError:0 0 0 2px rgba(245,63,63,0.2)
<Height-Base> heightSm:24px heightMd:32px heightLg:40px

# Coordinate Values
intent.primary.intentBg:--colorBrandPrimary
intent.primary.intentFg:--colorTextInverse
intent.primary.intentBorder:--colorBrandPrimary
intent.primary.intentOnBg:--colorTextInverse
intent.primary.intentFocusRing:--shadowFocusPrimary
intent.primary.intentSubtleBg:rgba(0,82,217,0.08)
intent.danger.intentBg:--colorError
intent.danger.intentFg:--colorTextInverse
intent.danger.intentBorder:--colorError
intent.danger.intentOnBg:--colorTextInverse
intent.danger.intentFocusRing:--shadowFocusError
intent.neutral.intentBg:--colorBgDisabled
intent.neutral.intentFg:--colorTextPrimary
intent.neutral.intentBorder:--colorBorder
emphasis.filled.emphasisBg:@intent.intentBg
emphasis.filled.emphasisFg:@intent.intentOnBg
emphasis.filled.emphasisBorderColor:transparent
emphasis.filled.emphasisBorderWidth:0
emphasis.outlined.emphasisBg:transparent
emphasis.outlined.emphasisFg:@intent.intentFg
emphasis.outlined.emphasisBorderColor:@intent.intentBorder
emphasis.outlined.emphasisBorderWidth:1px
emphasis.ghost.emphasisBg:transparent
emphasis.ghost.emphasisFg:@intent.intentFg
emphasis.ghost.emphasisBorderColor:--colorBorder
emphasis.ghost.emphasisBorderWidth:1px
emphasis.tonal.emphasisBg:@intent.intentSubtleBg
emphasis.tonal.emphasisFg:@intent.intentFg
emphasis.tonal.emphasisBorderWidth:0
shape.default.shapeRadius:--radiusMd
shape.pill.shapeRadius:9999px
shape.square.shapeRadius:0
surface.solid.surfaceBg:--colorBgBody
surface.elevated.surfaceBg:--colorBgBody
surface.elevated.surfaceShadow:--shadowMd
surface.overlay.surfaceBg:--colorBgBody
surface.overlay.surfaceBackdrop:rgba(0,0,0,0.45)
state.hover.stateOverlay:rgba(0,0,0,0.06)
state.active.stateOverlay:rgba(0,0,0,0.12)
state.focus.stateShadow:--shadowFocusPrimary
state.disabled.stateOpacity:0.4
state.disabled.stateCursor:not-allowed

# Overrides

</Theme-ProjectName>
```

### App, Section, Component Responsibility Division

| Dimension                    | App (.vx)                    | Section (.sc)                | Component (.cp)              |
| ---------------------------- | ---------------------------- | ---------------------------- | ---------------------------- |
| Core Responsibilities        | Route management, Section orchestration, global state | Business module, data interaction, complete business logic | Pure UI display, reusable, no business logic |
| Call ServiceDomain           | ❌                           | ✅                           | ❌                           |
| Contain Section              | ✅                           | ❌                           | ❌                           |
| Contain Component            | ✅                           | ✅                           | ❌                           |
| Use For/If                   | ❌ (no For/TreeFor)          | ✅                           | ✅                           |
| Can nest children when used  | N/A                          | ❌ (widgets only)            | ❌ (widgets only)            |
| External layout on root      | N/A                          | ❌ (set by App)              | ❌ (set by parent)           |

**Key Rules:**

- Section and Component are **independent components** when used — strictly forbidden to nest other components under them (except widgets)
- App cannot directly add basic UI components or contain business logic
- Section cannot nest other Sections or handle route navigation
- Component cannot call ServiceDomain or nest other Components

#### Style Property Responsibility Division

**Core Principle:** Outer file controls "position and space", Section/Component definition file controls "appearance and content". (Outer file means App file, or if Section embeds Component, then relative to Component, this Section file is the outer file)

| Property Type              | Specific Properties                        | Outer | Section/Component Internal |
| -------------------------- | ------------------------------------------ | ----- | -------------------------- |
| **External Size**    | width, height                              | ✅    | ❌                         |
| **Flex/Grid**        | flex, grid-column, etc.                    | ✅    | ❌                         |
| **External Spacing** | margin, margin-\*                          | ✅    | ❌                         |
| **Positioning**      | position, top, left, etc.                  | ✅    | ❌                         |
| **Visibility**       | show                                       | ✅    | ❌                         |
| **Internal Spacing** | padding, padding-\*                        | ❌    | ✅                         |
| **Visual Styles**    | background-_, border-_, box-shadow, etc. | ❌    | ✅                         |
| **Content Overflow** | overflow, overflow-\*                      | ❌    | ✅                         |
| **Size Constraints** | min-width, max-width, min-height, etc.     | ⚠️  | ✅                         |

**Preview Size Annotation:** Section/Component root component does not define external layout properties, only annotates preview values via comments

```vl
// Preview: width:240px height:100vh
<Section-Sidebar "root"> padding:--spacing16 min-width:"200px"
```

## Typical Error Examples

```vl
// ❌ Error: Section nested inside Section
<Section-MainLayout "root">
-<Section-Sidebar "sidebar">

// ❌ Error: Component calling ServiceDomain
<Component-UserCard "root">
<ServiceDomain-User "userService">

// ❌ Error: Nesting child components under Section
<Section-ProductList "productList">
-<Component-Pagination "pagination">

// ❌ Error: Section root component defining external layout properties
<Section-ProductCard "root"> width:"320px" margin:"16px" padding:"24px"
```

## Core Syntax Constraints (Globally Applicable)

VL follows strict formatting rules to ensure code consistency and parsability. The following constraints apply globally unless specific components or syntax have explicit exceptions:

#### Single-Line Rule (Mandatory)

Many definitions and statements **must** be completed on a single line; line breaks are not allowed. This includes but is not limited to:

- Variable definitions (global `$var(...) = ...`, local `_var(...) = ...`, `_var({}) = {}`, `_var([]) = []`).
- Method, service, event, pipe definition lines (i.e., the first line, including all parameters and `RETURN` declarations).
- All `RETURN {...}` (for METHOD/SERVICE) or `RETURN value` (for PIPE) statements.
- All assignment statements (`$var = ...`, `_var = ...`).
- Object and array initialization assignments (even if structurally complex).
- Component property definitions on a single line (even if multiple properties separated by spaces, still on the same line).

Violating this rule will cause compilation errors. The following sections will not repeat "single-line rule" for each applicable case; developers should remember this global constraint.

#### No Leading Spaces and Flush Output Rule (Mandatory)

- All `-` (minus/hyphen) symbols representing hierarchical structure **must be flush left**; no spaces are allowed before them.
- In fact, in VL syntax, as long as a line has content, there should be **no spaces before any content** (except JSON code blocks or specific embedded languages).

#### Semicolon (;) Usage (Strict)

- Semicolons are also used as separators in `FOR` counting loop control parts (e.g., `FOR (_i(INT)=0; _i<10; _i++)`).
- **Forbidden** to use semicolons at the end of ordinary code lines (such as variable assignments, method calls, RETURN statements).
- **Forbidden** to use semicolons between style properties or after the last style property.

#### String Escaping

**Strictly forbidden to use any `\` escape character! Strictly forbidden to use `\` escape character anywhere! Check and remove all `\` escape characters before output!**

Important things said three times! Otherwise it will cause serious compilation errors!!

#### Indentation

VL uses `-` without spaces to represent indentation:

- **Top-level definitions (no indentation):** Root components (`<Section-..>`), section headings (`# Frontend Global Vars`, `# Services`, `# Frontend Tree`, etc.), and method/service/event/pipe definition lines (`METHOD...`, `SERVICE...`, `EVENT...`, `PIPE...`) are usually at the leftmost position of the code file, without leading `-`.
- **Frontend Tree:**

  - Components added directly under root are written without leading `-`.
  - Child components add one `-` at the beginning for each deeper level. For example:

    ```vl
    <Block-Header>
    -<Text-Title> value:"Title"
    <Block-Content>
    -<Button-Submit> value:"Submit"

    <VirtualTable-Users> ..
    -<Field-_id> ... // Field is VirtualTable child component
    ```
- **Inside methods/event handlers:**

  - Method/event handler body code blocks must all be indented at least one level (starting with `-`).
  - Control flow structures (`IF`, `FOR` blocks) introduce deeper indentation levels.

#### Section Markers and Comments

`#` represents standard section structure markers (such as `# Frontend Tree`, `# Frontend Default Styles`). Note: please strictly follow the preset section structure and order according to the current file development specification.

`//` represents inline comments and line comments.

`/*` and `*/` represent block comments.

Example:

```vl
// VL_VERSION:2.8

<Section-antUploadDragger>
/*
This module is mainly used to simulate the UploadDragger component in Ant Design.
*/

# Frontend Global Vars
$uploadedFiles([{uid:STRING,name:STRING,status:STRING,url:STRING,size:INT}]) = []

</Section-antUploadDragger>
```

## Naming Conventions

#### File Naming:

All file names are uniformly PascalCase and must match the root component:

`UserAuth.vs` file, root component is:

```
<ServiceDomain-UserAuth>
File body
</ServiceDomain-UserAuth>
```

#### **Component Instance Naming**:

- Component names use **PascalCase** (e.g., `UserCard`, `LoginButton`, `NoteItemCard`, `AddButton`).
- Component names should reflect component purpose.
- Component IDs use camelCase. Component IDs should reflect component purpose and type, e.g., `<Button-Submit "submitButton">`, `<Block-ModuleRoot "root">`, `<VirtualTable-Users "userTable">`

#### **Variable Naming**

- **Frontend global variables** (`# Frontend Global Vars`): `$` prefix + **camelCase** (e.g., `$currentPage`, `$userData`).
- **Derived variables** (`# Frontend Derived Vars`): `$` prefix + **camelCase** (e.g., `$fullName`, `$canSubmit`).
- **Local variables created in methods** (`_varName(TYPE) = ...` or `_varName({}) = {}` or `_varName = []`): uniformly use `_` prefix + **camelCase** (e.g., `_result`, `_tempData`). **Must** declare type or infer through empty structure, **no** `let` keyword.
- **Loop variables**:
  - Loop variables are a "**special local variable**" that can be used directly without definition.
  - `FOR...IN` loops: Loop item variables and index variables **must** use `_` prefix + **camelCase**. Index variables should use `_indexX` (X starts from 0, e.g., `_index0`, `_index1`). Loop item variables can be named based on context (e.g., `_user`, `_product`, `_noteItem`) or use `_itemX` for generic iteration (e.g., `_item0`, `_item1`, `_item2`). Example: `FOR (_user, _index0) IN $userList` or `FOR (_item0, _index0) IN dataArray`.
  - `FOR (...)` counting loops: Loop control variables (like `i`, `j`, `k` or more meaningful names like `counter`) **must** use `_` prefix + **camelCase** (e.g., `_i`, `_j`, `_k`, `_loopCounter`). Declare in `FOR` parentheses using `_varName(TYPE) = initialValue` (e.g., `FOR (_i(INT) = 0; _i < 10; _i++)`).

#### **Method/Function Names**:

- **Frontend public methods** (`METHOD_PUB`): **PascalCase** (e.g., `ProcessData`, `ValidateForm`, `ReloadList`)
- **Frontend/backend internal methods** (`METHOD`): **camelCase** (e.g., `loadData`, `loadNotesFromServer`, `validateBackendInput`)
- **Backend services** (`SERVICE`): **PascalCase** (e.g., `UserLogin`, `GetDocList`)
- **Frontend/backend pipeline (PIPE) functions**: (for pure data transformation): `_` prefix + **camelCase** (e.g., `_formatCurrency`, `_formatDate`)

#### Event Names:

**Events** (`<Component>.@click`): Event names all use camelCase (e.g., `@click`, `@init`, `@tick`, `@keyDown`).

#### **Method/Function Parameters**:

- All types of method/function **parameter names use camelCase, without `_` (underscore) prefix**.
- Example: `METHOD myMethod(userId(INT), configData({}))`, parameters are `userId`, `configData`.
- Example: `PIPE _formatDate(dateValue(TIMESTAMP), formatString(STRING))`.
- **Note**: When referencing these parameters inside methods, use their defined names directly (e.g., `userId`, `configData`).

#### Tables and Fields

- All table names use PascalCase, including Database Tables and ServiceDomain VirtualTables
- All field names use camelCase

#### Other

- **Public event definitions** (`EVENT @eventName`): **camelCase** (e.g., `itemSelected`, `formSubmitted`).

## Components

### Component Instance Creation

#### Creation Location

| Applicable Files | Definition Section | Core Purpose                                            |
| ---------------- | ------------------ | ------------------------------------------------------- |
| vx, sc, cp       | # Frontend Tree    | Frontend UI layout and functional component declaration |
| vs               | # Backend Tree     | Backend component declaration                           |

#### Component Definition Format

```vl
<ComponentClass-ComponentName "componentId"> functionalProp1:value1 functionalProp2:value2 layoutCSS1:value1...
```

**Special Notes:**

- **<> must appear in pairs; absolutely cannot have only opening "<" without closing ">".**
- **Inside <> only "ComponentClass-ComponentName" and "componentId"; everything else must be outside the angle brackets.**

##### Component Elements

| Element                      | Description                                               | Naming Rule | Example                           | Notes                                                                                                |
| ---------------------------- | --------------------------------------------------------- | ----------- | --------------------------------- | ---------------------------------------------------------------------------------------------------- |
| ComponentClass               | System-predefined component type                          | Fixed       | `Button`, `Text`, `Input`   | Cannot be modified, defined by system                                                                |
| ComponentName                | Developer-defined descriptive name reflecting purpose     | PascalCase  | `SubmitButton`, `UserStatus`  | Must be meaningful for understanding                                                                 |
| ComponentId                  | Unique identifier for component within file               | camelCase   | `"submitBtn"`, `"userStatus"` | Optional, only specify when reference needed,**pure static string, expressions not supported** |
| Functional Properties        | Properties defined in component documentation             | -           | `value`, `disabled`           | Strictly reference component docs, forbidden to invent properties                                    |
| Layout CSS (frontend only)   | Layout-only CSS properties (visual styles managed by Theme) | -           | `width`, `padding`, `margin`  | Only layout properties allowed; visual styles (color, border, shadow etc.) forbidden                 |

**Key Distinctions:**

- **ComponentName** vs **ComponentId**:
  - ComponentName is the descriptive identifier for the component type, used for type matching in definition and reference
  - ComponentId is the unique identifier for the component instance, only used to distinguish different instances within the same file
  - When referencing, must use `<ComponentClass-ComponentName "componentId">`, cannot replace ComponentName with ID

##### ✅ Correct Examples

```vl
<Button-Submit "submitButton"> value:"Submit" disabled:(!$canSubmit)
<Text-Welcome> value:"Hello"
<Image-Logo "logo"> sourceUri:$logoUrl alt:"Company Logo" height:"40px" width:"auto"
<Text-UserStatus> value:($isLoggedIn ? "Online" : "Offline")
```

##### Error 1: Component Definition Line Break

```vl
❌ <Section-DynamicFormFields>
     value:$formData[_field.name]
     error:$formErrors[_field.name]

✅ <Section-DynamicFormFields> value:$formData[_field.name] error:$formErrors[_field.name]
```

### Component Tree Structure

#### Root Component

The root component is a special component that serves as the starting marker for the entire file, added at the beginning of the file. Otherwise, its usage rules are the same as regular components:

- Frontend root components (`<App>`, `<Section>`, `<Component>`) also have layout container functionality; all components in `# Frontend Tree` are added under this container. Its layout function is the same as a `Col` container; style properties can be added, e.g., `<Section-ProductCard "root"> width:"320px" min-height:"400px"`
- Frontend root components can add `@init()` and other common layout container events, e.g., `<App-MyApp "root">@init()`, `<Section-MySection "root">@init()`
- `<ServiceDomain>` root component currently has no properties or methods, serves only as file start declaration

#### Component Creation Order

In frontend component tree, component creation order is:

1. Functional components (no UI), such as FrontendApi, Trigger, WindowEventListener, ClientUserCenter, etc.
2. UI and container components

In backend component tree, component creation order is:

1. Functional components, such as ServerApi, etc.
2. Backend data components, such as VirtualTable

#### Component Parent-Child Relationships

When any component B is a child of another component A, add B under A with one additional indentation level from A. In VL, parent-child relationships exist in the following scenarios:

**Cases Where Child Components Are Allowed**

- All container components (UI containers, logic containers) can have other frontend components (containers, basic UI components, extended UI components, etc.) as children
- Non-UI functional components (FrontendApi, Trigger, etc.) can only be direct children of root component
- Any component with UI (UI containers, UI components) can add widgets to extend its functionality (StateStyle, Animation, UseDrag, etc.)

**Cases Where Child Components Are Strictly Limited or Forbidden**

- Non-UI functional components: strictly forbidden to add any children
- Non-container UI components (basic/extended UI components): forbidden to add any children except widgets
- Module components (Section/Component): similar to extended UI components, forbidden to add any children except widgets

### Subsequent Component Usage and Access

#### Component Usage Scenarios

After components are defined in the component tree, they can be used in subsequent events/methods/functions/expressions. Strict rules as follows:

| Usage                                                                   | Events | Methods | PIPE Functions/Expressions |
| ----------------------------------------------------------------------- | ------ | ------- | -------------------------- |
| Listen to component events, e.g.,`.@init()`                           | ✅     | ❌      | ❌                         |
| Call component methods, e.g.,`.scrollToBottom()`                      | ✅     | ✅      | ❌                         |
| Access component read-only properties, e.g.,`_position = .offsetLeft` | ✅     | ✅      | ✅                         |

#### Correct Component Access Method

Reference using `<ComponentClass-ComponentName "componentId">`. Note: ComponentClass, ComponentName, and componentId must strictly match the definition in the component tree. **Do not confuse ComponentName with componentId.**

```
# Frontend Tree
<Button-Next "nextButton"> disabled:$status

# Frontend Event Handlers
<Button-Next "nextButton">.@click() // Content inside angle brackets strictly matches component tree
```

#### Incorrect Access Methods (Strictly Avoid)

```
❌ <Button-BackToProjects "backToProjects">.@click()  // Wrong: used ID as ComponentName
✅ <Button-BackButton "backToProjects">.@click()      // Correct: ComponentName must match definition

❌ _currentObj = <Block-ScrollItem "scroller">         // Wrong: cannot assign component to variable
✅ _distance = <Block-ScrollItem "scroller">.scrollTop // Correct: access read-only property directly

❌ <Block-Container "box">.style.color = "red"         // Wrong: no .style access exists
✅ <Block-Container "box"> color:$color                // Correct: bind variable, then modify variable
   -$color = "red"

❌ _userSubMenu.style.display = "block"                // Wrong: no display manipulation
✅ <Col-UserSubMenu "userSubMenu"> show:$show          // Correct: use show property
   -$show = true
```

#### Define Before Use Principle

Except for system method class components, all other components need to be defined in the component tree first before they can be referenced in subsequent methods/functions.

Please pay special attention to these functional non-UI components that also need to be defined first: `Trigger`, `FrontendApi`, `WindowEventListener`, `ClientUserCenter`

#### System Method Class Components

System method class components are special components with only one global instance, providing convenient access to system methods. Therefore, they don't need to be defined in the component tree and can be used directly, e.g.:

`<ClientUtils>.consoleLog(123)`

### Component Properties

#### Property Order

**Please strictly follow this order when specifying component properties:**

- Functional properties: such as value, type, disabled, etc., strictly refer to component documentation
- Layout CSS properties: width, height, padding, margin, flex, gap, etc. (visual styles managed by Theme, forbidden here)

#### Read-Only and Non-Read-Only Properties

- **Non-read-only properties** define component behavior, data, logic, core characteristics, and non-visual state. They determine what the component "is" and "how it works".
- **Read-only properties** are mainly read-only properties of DOM elements, such as offsetWidth. These properties don't need to be defined in `# Frontend Tree` and can be accessed directly in methods/functions later.
- Whether read-only or non-read-only properties, please **strictly refer to component documentation**; inventing any properties is not allowed.

#### Property Read/Write Rules (Unidirectional Data Flow)

VL uses **Unidirectional Data Flow** architecture, **there is no v-model syntactic sugar**.

##### Non-Read-Only Property Read/Write Standards (Attribute Mutability)

1. **Forbidden** to **directly read or modify component non-read-only properties** in any method/event/function/expression (like `Button.color` or `Modal.show = false`).
2. If dynamic property control is needed, follow the **"variable intermediary"** pattern:
   - First **bind** a variable to the property (like `show:$isModalVisible`).
   - In logic, **only modify that variable** (`$isModalVisible = false`), letting reactive binding drive component refresh.

##### Read-Only Property Read/Write Standards

Read-only properties can be read in methods/functions (not written), won't break unidirectional data flow:

```
# Frontend Event Handlers

<Button-CheckSize "checkButton">.@click()
// ✅ Allowed: Reading size information
-_buttonWidth(FLOAT) = <Button-Submit "submitButton">.offsetWidth
-_buttonHeight(FLOAT) = <Button-Submit "submitButton">.offsetHeight
-_rect({}) = <Block-MainContainer "mainContainer">.getBoundingClientRect()

// ✅ Allowed: Reading position information
-_scrollTop(FLOAT) = <Block-Content "docContent">.scrollTop
-_offsetLeft(FLOAT) = <Image-Logo "logo">.offsetLeft
```

## Variables

### Basic Types

- **STRING**: Text string, e.g., "Hello". String values are usually wrapped with double quotes `"`. When string value needs to contain double quotes inside, single quotes `'` can be used. **Strictly forbidden to use any `\` escape character in VL.**
- **INT**: Integer, e.g., 42
- **FLOAT**: Floating point number, e.g., 3.14
- **BOOL**: Boolean value, true or false
- **TIMESTAMP**: Internally stores standard time string format, e.g., 2024-12-12 11:11:11.342. When defining, strings without milliseconds can be passed, e.g., 2024-12-12 11:11:11. As "time currency", it can be used in all time-related scenarios. (See Timestamp Type detailed section)

### Compound Types

- **Array**: `[elementType]`, e.g., `[INT]`, `[STRING]`, `[{id:INT,name:STRING}]`. When internal structure is uncertain, use `[]`.
- **Object**: `{field:Type}`, e.g., `{id:INT,name:STRING,items:[{id:INT}]}`. When internal structure is uncertain, use `{}`.
- **Compound type initialization** must include all required fields, or use legal empty structures (like empty object `{}` or empty array `[]`);

### Timestamp Type

#### Timestamp Variable Assignment

VL's TIMESTAMP type uses a unified string format as "time currency", like `2024-12-12 11:11:11.342` or `2024-12-12 11:11:11`, milliseconds can be omitted. When assigning "=" to a timestamp global or local variable, the following input types are accepted:

- **System variable**: e.g., `$serverDate = SYSENV.currentTime`.
- **Unix timestamp**: Millisecond precision; for second precision, use `setUnixS()` method
- **String** (five formats, all case-sensitive):

  - `"YYYY-MM-DD HH:mm:ss"`
  - `"YYYY-MM-DD HH:mm:ss.SSS"`
  - `"YYYY-MM-DD"`
  - `"YYYY-MM-DDTHH:mm:ssZ"`
  - `"YYYY-MM-DDTHH:mm:ss.SSSZ"`
- **Recommended initialization format**:

  - Preferably use complete format when defining: `$createTime(TIMESTAMP) = "2024-12-12 11:11:11.342"`
  - System variable `SYSENV.currentTime` returns standard time string format (with milliseconds)

#### Timestamp Variable Usage

TIMESTAMP variables can be used directly in most scenarios without explicit conversion

- All time-related variable assignments: `$eventTime(TIMESTAMP) = "2024-12-12 11:11:11"`
- Parameter passing: `processEvent(eventTime)` where eventTime is TIMESTAMP type
- Database time comparison: `[["createTime", "gt", $startTime]]`

**Example**:

```vl
$eventTime(TIMESTAMP) = "2024-12-12 15:30:00"
$displayTime(STRING) = $eventTime.format("YYYY-MM-DD HH:mm")
<Text-EventTime> value:($eventTime.format("MM/DD HH:mm"))
```

#### Timestamp Variable Methods and Functions

**Immutable methods:**

- **Format output**: Use `.format(outputFormat)` method for formatted display. Output format includes: YYYY (4-digit year, e.g., 2024), YY (2-digit year, e.g., 24), M (1-digit month, 1-12), MM (2-digit month, 01-12), MMM (short month name, e.g., Jan, Feb), MMMM (full month name, e.g., January), D (1-digit day, 1-31), DD (2-digit day, 01-31), d (day of week, 0-6), H (24-hour 1-digit hour, 0-23), HH (24-hour 2-digit hour, 00-23), h (12-hour 1-digit hour, 1-12), hh (12-hour 2-digit hour, 01-12), m (1-digit minute, 0-59), mm (2-digit minute, 00-59), s (1-digit second, 0-59), ss (2-digit second, 00-59), SSS (3-digit millisecond, 000-999), A (12-hour AM/PM uppercase), a (12-hour am/pm lowercase)
- **Timestamp retrieval**: Use `.unixS()` and `.unixMS()` methods

**Mutable functions:**

- `variable.setUnixS(secondTimestamp)`
- `variable.setUnixMS(millisecondTimestamp)`
- `variable.setCustomFormat("timeString", "correspondingFormatString")`

**Forbidden operations**:

- **Forbidden to directly call JavaScript Date API**: Direct calls to `new Date(...)`, `.getTime()`, `.getFullYear()`, `.getMonth()`, `.getDate()` and other native JS Date methods are not supported

### Variable Definition

#### Frontend Global Variable Definition (`# Frontend Global Vars`)

Frontend global variables are accessible at file level in the frontend environment, using `$` prefix:

```
$variableName(Type) = initialValue
```

Examples:

```vl
$userName(STRING) = ""
$userCount(INT) = 0
$isLoggedIn(BOOL) = false
$userData({id:INT,name:STRING,age:INT}) = {id:0,name:"",age:0}
$items([{id:INT,title:STRING}]) = []
$genericArray([{}]) = [{}]
```

**Important Rules:**

- All variables must have initial values; initial values can be empty (`""/[]/{}`) but cannot be `null`

#### Derived Variable Definition (`# Frontend Derived Vars`)

Derived variables are read-only variables automatically calculated from other variables:

```vl
# Frontend Global Vars
$firstName(STRING) = "John"
$lastName(STRING) = "Doe"
$isLoading(BOOL) = false
$cartItems([{name:STRING,price:FLOAT,quantity:INT}]) = []

# Frontend Derived Vars
$itemCount(INT) = $cartItems.reduce((acc, item) => acc + item.quantity, 0)
$canSubmit(BOOL) = ($firstName != "" && !$isLoading)
$userSummary(STRING) = ("User: " + ($firstName + " " + $lastName) + " (Status: " + ($isLoading ? "Loading" : "Ready") + ")")
$loadingStatus(STRING) = $isLoading._mapLoading()
```

**Important Rules:**

- Can only contain pure calculations; cannot call METHOD/SERVICE, but can use PIPE functions and variable immutable functions
- Derived variables are read-only, cannot be assigned in code
- Important: **Derived variables must define type**

#### Local Variable Definition

##### Method/Function Internal Local Variables

Local variables are used inside methods, using `_` prefix. They **must** explicitly declare type (e.g., `_varName(TYPE) = ...`) or infer type through empty structure initialization (e.g., `_varName({}) = {}`, `_varName([]) = []`). **No** `let` keyword:

```
_variableName(Type) = value
// or
_variableName({}) = {}
_variableName([]) = []
```

Example:

```vl
METHOD processData()
-_result({type:STRING}) = {}
-_count(INT) = 0
-_userList([{id:INT,name:STRING}]) = []
-_lookupTable({}) = {}
-_genericItems([{}]) = [{}]
```

- Local variables, like global variables, need type declaration or type inference through empty structure at initialization. (Loop control variables are a special case of this rule, see Loop section)
- When declaring local variables, **do not forget the equals sign and initial value**, otherwise local variable definition will be mistaken for public method call:

```
METHOD processData()
-_condition([]) = [] // Define a local variable named _condition
-_condition([]) // Call a public method named _condition
```

##### Loop Container Local Variables

In For, Tree and other loop container component properties, local variables for the current loop container can be declared. For example:

```
<For-UserList> sourceArray:$users,loopVar:[_item0,_index0] // _item0, _index0 are the loop variable and loop index for current structural loop, local variables declared in component tree, please use _ prefix
```

#### System Variables (`SYSENV`, `WINDOW`)

System variables can be used directly to get current system environment information.

| Variable Name      | Applicable Scope                       | Internal Properties                                                                                                                                                                                                                                                                                                                                                   |
| :----------------- | :------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SYSENV.currentUser | Frontend and Backend                   | **isLogin**: BOOL (whether user is logged in) **userId**: STRING (user ID) **userInfo**: {id:INT, username:STRING, avatar:STRING, deleted:INT, deptId:INT, disableStatus:INT, email:STRING, lastTimeLogin:TIMESTAMP, fullName:STRING, nickname:STRING, phoneNumber:STRING} (current user info object) **tenantId**: INT (tenant ID, may be 0) |
| SYSENV.currentTime | Frontend and Backend                   | None. Can be directly assigned to a time variable, e.g.,`$currentTime(TIMESTAMP) = SYSENV.currentTime`                                                                                                                                                                                                                                                              |
| SYSENV.requestInfo | Backend Only                           | **ip**: STRING (request client IP) **userAgent**: STRING (request client UA string) **headerInfo**: {} (current request header info) **cookie**: {} (current request cookie)                                                                                                                                                                  |
| WINDOW             | Frontend Only (expressions and events) | Provides read-only access to browser `window` object properties. Used with components to respond to window events (like `resize`, `scroll`). **Forbidden to call** `WINDOW` object methods. Accessible properties include: `innerWidth`, `innerHeight`, `outerWidth`, `outerHeight`, `devicePixelRatio`, `scrollX`, `scrollY`, etc.       |
| --themeTokenName   | Frontend                               | All Token variables defined in Theme.vth can be directly referenced in frontend code, e.g.,`font-size:--fontSizeLg color:--colorTextDefault`                                                                                                                                                                                                                        |

### Variable Assignment and Modification

#### Variable Assignment

Variable assignment uses equals sign `=`, no need to re-declare type:

```
$variableName = newValue
_variableName = newValue
```

- `=` operation follows JS rules: when new value is a simple value (STRING, INT, FLOAT, BOOL), assigns the value itself; when new value is a complex data structure (array, object, JSON), assigns a reference to that data structure.

#### Complex Data Structure "In-Place Modification" Support

VL **does not require** **data immutability** for complex data structures (objects, arrays, JSON) as in React/Vue frameworks; the framework automatically handles data updates and performance optimization after in-place modification. VL **supports and recommends directly modifying parts of complex structures**:

```
# Frontend Global Vars
$users([{name:STRING}]) = []

# Frontend Tree
-<For-UserList> sourceArray:$users loopVar:[_item0,index0]
--<Text-Name> value:_item0.name

# Frontend Event Handlers
<Button-Change "changeButton">.@click()
$users[0].name = "adam" // Directly modify a value in the array; bound UI will automatically change; no need to follow immutability, create a new array and assign back
$users.push("alice") // Modify array in-place via mutable method; bound UI will also automatically update
```

#### Variable Mutable Methods

In methods and events, variable **mutable** methods (that modify the original variable) can be called. These operation statements follow the indentation rules of their code block (usually at least one level `-`).

**Important: Mutable methods can only be called directly in methods; any expression (including property bindings, `conditions`, `IF/FOR` conditions/loop bodies, etc.) can only use immutable functions.**

| **Variable Type** | **Mutable Methods Allowed in Methods**                                             |
| :---------------------- | :--------------------------------------------------------------------------------------- |
| Array                   | `push`, `pop`, `shift`, `unshift`, `splice`, `sort`, `reverse`, `delete` |
| Object                  | `Object.assign`, `delete`                                                            |
| Time                    | `setUnixS`, `setUnixMS`, `setCustomFormat`                                         |

> **⚠️ Usage Restriction**: Mutable operations can only appear as independent statements in method bodies; they cannot be used in expressions, conditional judgments, or chained calls.
> Incorrect example: `_result = items.push(newItem)`
> Correct example:
>
> ```vl
> items.push(newItem)
> _result = items
> ```

**Example (in method):**

```vl
METHOD manageList(items([STRING]), newItem(STRING)); RETURN {updatedList:[STRING], success:BOOL}
-_listCopy([STRING]) = items.slice()
-_listCopy.push(newItem)
-_listCopy.splice(0, 1)
-_listCopy.sort()
-RETURN {updatedList:_listCopy, success:true}

METHOD updateTimestamp(timeVar(TIMESTAMP)); RETURN {newTime:TIMESTAMP, success:BOOL}
-_localTime(TIMESTAMP) = timeVar
-_localTime.setUnixS(1700000000)
-RETURN {newTime:_localTime, success:true}
```

#### Variable Built-in Immutable Functions/Properties

Variable built-in immutable functions can be called in expressions. Types include:

| Category         | Immutable Functions                                                                                                                                                                |
| :--------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Array            | `map()`, `filter()`, `reduce()`, `indexOf()`, `includes()`, `slice()`, `concat()`, `join()`, `length` (property)                                                 |
| String           | `split()`, `trim()`, `toLowerCase()`, `toUpperCase()`, `replace()`, `replaceAll()`, `substring()`, `slice()`, `includes()`, `indexOf()`, `length` (property) |
| Number           | `toFixed()`, `toPrecision()`, `toExponential()`                                                                                                                              |
| Object           | `Object.keys()`, `Object.values()`, `Object.entries()`                                                                                                                       |
| Time             | `unixS()`, `unixMS()`, `format()`                                                                                                                                            |
| Type Check       | `typeof`                                                                                                                                                                         |
| Math             | `Math.random()`, `Math.floor()`, `Math.ceil()`, `Math.round()`, `Math.max()`, `Math.min()`, `Math.abs()`, `Math.pow()`                                             |
| JSON Processing  | `JSON.parse()`, `JSON.stringify()`                                                                                                                                             |
| Regex Processing | `match()`, `test()`                                                                                                                                                            |
| Type Conversion  | `String()`, `Number()`, `parseInt()`, `parseFloat()`, `Boolean()`, `isNaN()`, `isFinite()`                                                                           |

- Variable built-in functions can be called directly without pre-definition.
- When calling, use function name directly, **do not add `_` prefix:**
  - Correct (direct use): `_num.toFixed()`
  - Incorrect (confused with PIPE function, adding `_`): `_num._toFixed()`

#### Forbidden JS Methods:

- `toString()`: Please use `String()` instead, which has broader applicability

#### "Callback Function Parameter" Usage Rules in Variable Methods

##### Hard Rules (Must / Must Not)

- **MUST**: In map / filter / reduce / some / every / sort callback function parameters, **must use arrow functions, and function body must be a single expression (concise body).**
- **MUST**: **Callbacks must be pure synchronous, no side effects** (must not modify external/parent variables, must not call async METHOD/component methods)
- **MUST NOT**: Use statements with side effects in callbacks (like acc[k]=..., push/splice and other write operations)
- **MUST NOT**: Write return statement blocks.

✅ **Correct (pure expression)**:

```vl
arr.reduce((acc, x) => acc + x, 0)
arr.map(x => ({ id: x.id, name: x.name?.trim() }))
params.reduce((acc, p) => ({ ...acc, [p.name]: p.def ?? "" }), {})
```

❌ **Incorrect (statement block + side effects)**:

```vl
arr.reduce((acc, p) => { acc[p.name] = p.def || ""; return acc; }, {})
JSON.parse(...)._reduce((acc, p) => { ... }, {})
```

## Database Table and Virtual Table Field Types

Backend Database tables and virtual tables support the following field types: STRING, INT, FLOAT, BOOL, TIMESTAMP, JSON, VEC

Note: Backend table field types differ from variable types in the following ways:

- Backend has no object and array type fields; for complex structures, use JSON type uniformly
- Backend has additional VEC vector type field for vector search; VL currently doesn't support VEC type variables

Except for these two differences, other field types have identical data definitions to variable data types.

### Vector Field Usage

Vector fields are used for vector search. In VL, you only need to define a vector field's vecSource (source fields for vectorization), and the system will automatically vectorize source fields when table data is inserted/updated.

#### Vector Field Definition

**1. Define vector field in virtual table**

```
<ServiceDomainRoot-Root>
-<VirtualTable-Documents "docTable">  mockData:[{...}]
--<Field-title> type:STRING
--<Field-content> type:STRING
--<Field-contentVec> type:VEC vecSource:["title","content"] // Vector field data source is title and content, data will automatically vectorize these two fields
```

- In most cases, a virtual table only needs one vector field. Add all fields that may participate in content search as vecSource of the vector field, rather than having one vector field per content field.

**2. Define vector field in Database entity table**

```
<Table-documents> data:[{"_id":1,"title":"VL Framework Guide","content":"VL is an innovative visual programming language supporting full-stack development...","_user":"1","_create":"2024-01-15 09:30:00","_update":"2024-01-15 09:30:00"}] // No contentVec field in test data, this field is auto-generated by system
-<Field-_id> type:INT
-<Field-title> type:STRING
-<Field-content> type:STRING
-<Field-contentVec> type:VEC vecSource:["title","content"]
-other fields
```

Vector field binding differs from regular fields:

- Vector field binding doesn't support expressions, can only be one-to-one binding
- Virtual table and entity table vector field vecSource must be strictly consistent. For example, if virtual table's virtualVec field has sourceVec as virtualA, virtualB two virtual fields, and binds to entity table's realVec field; realVec's sourceVec is realA, realB. Then realA, realB and virtualA, virtualB must strictly correspond. When a virtual table vector field binds to an entity table vector field, their vectorization sources must also be one-to-one bound.

#### Vector Search

Vector search is implemented through `select` method's `conditions` (filtering) and `orderBy` (sorting) parameters:

**Vector sorting (orderBy):**

- Format: `[["vectorFieldName","searchText"],...]`
- Automatically sorts by similarity from high to low (vector distance from small to large)
- Can mix with regular field sorting: `[["contentVec","AI Tech"],["_create","desc"]]`

**Vector filtering (conditions):**

- Format: `["vectorFieldName","l2str","searchText",maxDistance]`
- maxDistance is maximum distance from search text, value is less than or equal to 1
- Can combine with regular filter conditions: `[["status","eq","published"],["contentVec","l2str","keyword",0.4]]`
- Supports use in OR conditions: `[["OR",["titleVec","l2str","keyword",0.3],["contentVec","l2str","keyword",0.3]]]`

**Example:**

```vl
-<VirtualTable-Documents "docTable">.select([["status","eq","published"],["contentVec","l2str",keyword,0.4]],[["contentVec",keyword],["_create","desc"]],[_offset,pageSize],null) -> _result
```

**Notes:**

- Vector fields don't need manual assignment during `insert`/`update`; system auto-generates based on `vecSource` fields
- Vector fields don't support `eq`, `contains` and other regular operators, only support `l2str` filtering and similarity sorting
- Search text is automatically vectorized by system for matching

## Logic Definition

### Conceptual Distinction: Events, Methods, Functions, and Expressions

#### Core Comparison Table

| Type                 | Definition                                                                       | Side Effects | Call Location                                                        | Can Use Internally              | Typical Use Cases                                    |
| -------------------- | -------------------------------------------------------------------------------- | ------------ | -------------------------------------------------------------------- | ------------------------------- | ---------------------------------------------------- |
| **Event**      | Passively triggered logic responding to user interaction or system state changes | ✅ Yes       | `# Frontend Event Handlers` section, listening to component events | Methods, Functions, Expressions | Handle clicks, inputs, initialization, etc.          |
| **Method**     | Actively callable units that execute complete business logic                     | ✅ Yes       | Event handlers, other methods                                        | Methods, Functions, Expressions | Data processing, service calls, state modification   |
| **Function**   | Pure data transformation computation units                                       | ❌ No        | Events, methods, functions, expressions                              | Functions, Expressions          | Formatting, validation, array transformation         |
| **Expression** | Computation formulas that return a single value                                  | ❌ No        | Property bindings, conditional judgments, derived variables          | -                               | UI display, conditional control, dynamic computation |

#### Mutual Call Rules (Strictly Follow)

|                         | Call Event | Call Method | Use Function | Use Expression |
| ----------------------- | ---------- | ----------- | ------------ | -------------- |
| **In Event**      | ❌         | ✅          | ✅           | ✅             |
| **In Method**     | ❌         | ✅          | ✅           | ✅             |
| **In Function**   | ❌         | ❌          | ✅           | ✅             |
| **In Expression** | ❌         | ❌          | ✅           | ✅             |

#### Quick Reference Examples

```vl
// Event: passively triggered, parameters have no type declaration
<Button-Submit "submitBtn">.@click()
-validateForm() -> _validation

<Input-Email "emailInput">.@change(newValue, oldValue)  // ✅ No types on event params
<Input-Email "emailInput">.@change(newValue(STRING), oldValue(STRING))  // ❌ Wrong

// Method: actively callable, has side effects, returns object
METHOD loadUserData(userId(INT)); RETURN {success:BOOL, data:{}}
-<ServiceDomain-User "userService">.GetUserInfo(userId) -> _result
-RETURN {success:_result.success, data:_result.data}

// Function (PIPE): pure, no side effects, named with _ prefix, usable in expressions
PIPE _formatPrice(price(FLOAT)); RETURN STRING
-RETURN ("¥" + price.toFixed(2))

<Text-Price> value:$price._formatPrice()  // ✅ PIPE in expression
<Text-Result> value:calculateTotal()      // ❌ METHOD in expression — forbidden

// Expression: property bindings, conditions, derived vars — no METHOD calls, no mutable methods
<Text-FullName> value:($firstName + " " + $lastName)
<If-HasItems> conditions:($items.length > 0)
$displayName(STRING) = ($userName != "" ? $userName : "Guest")  // Derived var
$sorted([{}]) = $items.sort((a, b) => a.price - b.price)       // ❌ .sort() is mutable
```

### Methods

#### Method Definition Location and Format

| Method Type                   | Applicable Files | Definition Section          | Definition Prefix | Method Name Format |
| ----------------------------- | ---------------- | --------------------------- | ----------------- | ------------------ |
| Frontend internal method      | vx, sc, cp       | # Frontend Internal Methods | METHOD            | camelCase          |
| Frontend module public method | sc, cp           | # Frontend Public Methods   | METHOD_PUB        | PascalCase         |
| Service (internal)            | vs               | # Services                  | SERVICE           | PascalCase         |
| Service (public HTTP)         | vs               | # Services                  | PUBLIC_SERVICE    | PascalCase         |
| Backend internal method       | vs               | # Backend Internal Methods  | METHOD            | camelCase          |

**Definition Format**

Method definition line is at top level, no indentation. All code lines in method body need at least one level of indentation (`-`).

```
<DefinitionPrefix> <MethodName>(param1(Type1),param2(Type2),...);RETURN {returnVal1:Type1,returnVal2:Type2,...}
-method body
```

For backend services in 2.8:

- Internal service declaration:

```
SERVICE ServiceName(...);RETURN {...}
```

- Public HTTP service declaration:

```
PUBLIC_SERVICE ServiceName(...);RETURN ReturnType;EXPOSE {method:STRING,receive:STRING,response:STRING}
```

`PUBLIC_SERVICE` is external-only entry. `Section` cannot call `PUBLIC_SERVICE` directly.

#### Method Parameter Definition

Method parameters use camelCase and need type specification, e.g.: `rawEmail(STRING), tags([FLOAT])`

#### Method Parameter Rules

##### Parameter Read-Only Principle

All method parameters are **read-only** — cannot be modified inside methods. Copy to a local variable first if mutation is needed. Only global variables (`$` prefix) can be directly modified inside methods.

```vl
METHOD processData(inputList([STRING])); RETURN [STRING]
-inputList.push("newItem")              // ❌ Cannot modify parameter
-_localList([STRING]) = [...inputList]  // ✅ Copy first
-_localList.push("newItem")            // ✅ Modify local copy
-$globalList.push("item")             // ✅ Global variables can be modified
-RETURN _localList
```

#### Method RETURN Structure

For all methods, **`RETURN` structure must be an object `{}`**, even if there's only one return value.

**To work with system default error handling mechanism, it's recommended that return objects always include** **success:BOOL** **field, and optionally** **message:STRING** **field. For example:**

> **Exception — `PUBLIC_SERVICE`**: Public HTTP services are **not** required to follow the `success:BOOL` wrapper convention. Their response structure is defined by external API contract requirements. See [`# Services`](#-services-backend-service-definition) for details.

```vl
METHOD calculateTotal(prices([FLOAT]),discount(FLOAT));RETURN {total:FLOAT,discounted:FLOAT,success:BOOL}
-_sum(FLOAT) = 0
-FOR (_price,_index0) IN prices
--_sum = _sum + _price
-_discountedValue(FLOAT) = _sum * (1 - discount)
-RETURN {total:_sum,discounted:_discountedValue,success:true}
```

#### Method Calling

**Call Methods**

- Calling file-internal custom methods: Use directly `<MethodName>(parameters)`. Frontend files can call frontend public methods and internal methods; ServiceDomain files can call services and backend internal methods;
- Calling system/component methods: Use `<ComponentClass-ComponentName "componentId">.methodName(parameters)`
- Calling variable methods: Use `<variableName>.methodName(parameters)`

**Handling Method Return Values**

Use `-> variableName` to store method return data to specified variable. `variableName` can be a pre-declared local variable (starting with `_`) or a pre-declared global variable (starting with `$`, depending on current environment). When there's no return value or return value isn't needed, `->` can be omitted.

```vl
-methodName(param1,param2,...) -> _apiResponse // Store value to pre-defined or undefined local variable. If undefined, system auto-creates this local variable
-<ServiceDomain-DomainName>.ServiceName(param1,param2,...) -> $globalStatus // Store value directly to global variable. Note: storing to global variable subfields is currently not supported, e.g., $globalStatus.type is not allowed
-<ClientUtils>.delay(1500) // Method has no return value
```

**Best Practice**: Prefer storing method/service call results to local variables (`_variableName`) to maintain clear scope and data flow. Only consider using global variables (`$variableName`) as receivers when genuinely needing to directly update an existing global state.

**Example:**

```vl
$isUserCreated(BOOL) = false

METHOD process(); RETURN {success:BOOL}
-_validationResult({})
-_creationDetails({}) = {}
-calculateTotal($prices, 0.1) -> _totalResult
-_finalTotal(FLOAT) = _totalResult.discounted
-<Section-MySection "mySection">.ValidateInput($email, $password) -> _validationResult
-IF _validationResult.success
--createUser($userData) -> _creationDetails
--$isUserCreated = true
--@userCreated(_creationDetails.userId)
-RETURN {success:true}
```

#### Internal Method Usage Boundaries

In frontend and backend development, internal methods are only used for defining **reusable logic**; their usage scenarios have strict standards:

- When a piece of logic is only used in one event method/service/public method, write that logic directly in that event method/service/public method. Forbidden to first define an internal method then call it in this event method/service/public method;
- When a piece of logic is used in 2 or more event methods/services/public methods, must encapsulate this logic as an internal method to avoid duplicate code

### Functions

#### Pipe Function Definition File and Section

In VL, custom data transformation pipe functions can be defined in code files:

| Function Type          | Applicable Files | Definition Section        |
| ---------------------- | ---------------- | ------------------------- |
| Frontend pipe function | vx, sc, cp       | # Frontend Pipeline Funcs |
| Backend pipe function  | vs               | # Backend Pipeline Funcs  |

#### Pipe Function Definition Format

```
PIPE <functionName>(param1(Type1),param2(Type2),...);RETURN returnVal1
-function body
```

- Function names use `_` prefix + camelCase, e.g., `_calculateTotal`

PIPE function parameter format requirements are identical to method parameter format.

#### Pipe Function RETURN Structure

PIPE functions are only for data processing and transformation; their RETURN structure can be flexibly handled based on current needs, can return any type supported by the data type system, for example:

```vl
# Frontend Pipeline Funcs

PIPE _toUpperCase(inputString(STRING));RETURN STRING
-RETURN inputString.toUpperCase()

PIPE _checkPrice(price(STRING));RETURN BOOL
-RETURN (Number(price) > 30)

# Backend Pipeline Funcs

PIPE _trimAndValidateEmail(email(STRING));RETURN STRING
-_trimmed(STRING) = email.trim()
-IF _trimmed.includes("@")
--RETURN _trimmed
-ELSE
--RETURN ""
```

#### Function Calling

All functions **can only be chained in expressions**, using `.` operator. See Function Call Examples section.

### Events

#### Event Handler Definition

All event handlers are uniformly defined in `# Frontend Event Handlers` / `# Backend Event Handlers` sections, consisting of two parts:

- Event listening statement
- Event handling body

**Definition Format:**

```vl
<ComponentClass-ComponentName "componentId">.@eventName(param1, param2...) // Event listening statement
-Event handling body
```

**Format Description:**

- Event listening statement has no indentation
- Event handling body all code has at least one level indentation (`-`)
- Event name must have `@` symbol prefix

**Naming Conventions:**

- Event names uniformly use **camelCase**
- Event parameter names use **camelCase**
- Parameter names must strictly follow definitions in component documentation

**Event Body Writing Rules**

Event handling body is essentially a method; its writing rules (indentation, variable operations, method calls, control flow, error handling, etc.) are identical to methods, refer to "Methods" section.

#### RETURN Statement

- Event handlers can use `RETURN` to terminate execution early
- Event handlers **don't need return values**; `RETURN` is followed by nothing

```vl
<Button-Submit "submitButton">.@click()
-IF !$canSubmit
--<SysUI>.showToast("Please complete required fields first", "warning")
--RETURN
-submitForm()
```

#### Event Parameters

Event parameters are defined in the event listening statement:

**When to Declare Parameters:**

- When event handling body needs to use event parameters, must declare parameters in parentheses of event listening statement
- Parameter names use **camelCase**, must exactly match definitions in component documentation
- Parameters **do not allow** type declarations; their types are entirely determined by the component

**When Parameters Can Be Omitted:**

- When event handling body doesn't need any event parameters, parentheses can be empty
- Example: `@click()` means listening to click event but not using event object

**Example:**

```vl
# Frontend Event Handlers

// Need to use event parameters
<Input-Username "usernameInput">.@change(newValue, oldValue)
-$username = newValue
-<ClientUtils>.consoleLog("Old value: " + oldValue)

// Don't need event parameters
<Button-Submit "submitButton">.@click()
-Submit logic, no need for @click parameters
```

#### Event Triggering Mechanism

**Triggering Rules:**

- Events are automatically triggered — **cannot be manually called** in code (no `.click()`, `.focus()`, `.blur()` DOM methods exist)
- Can only call methods explicitly declared in component documentation
- **No event propagation**: clicking a child component does not trigger parent's `@click`

#### Event Handling in Loops

- **Static IDs only**: ❌ `<Button-Action ("btn_" + _index0)>` → ✅ `<Button-Action "btn">`
- Loop variables (`_itemX`, `_indexX`) can be used directly in event handlers of components inside `<For>`/`<TreeFor>`. See For component docs for scope rules.

## Expressions

#### Allowed Operations in Expressions

1. **Arithmetic operators**: `+`, `-`, `*`, `/`, `%`, `**`
2. **Comparison operators**: `==`, `!=`, `>`, `<`, `>=`, `<=`
3. **Logical operators**: `&&`, `||`, `!` (operates on boolean values)
4. **Ternary operator**: `condition ? trueValue : falseValue`

```vl
$message = ($age >= 18) ? "Adult" : "Minor"
$complexResult = (($valueA > 10 && $valueB < 20) || $isOverride ? "Case1" : "Case2")
```

**Property values and derived expressions**: Parentheses required when there are operators; **Control statement conditions (IF/ELSE IF/ternary conditions)**: Outermost parentheses can be omitted, but parentheses are encouraged for complex logic to improve readability.

5. **Access variables**: `$globalVar`, `_localVar`, `_item0.field1`, `SYSENV.currentUser.userId`
6. **String concatenation**: Use `+` operator.
   **Important rule**: To ensure correct type and avoid potential issues, when concatenating strings, if expression doesn't start with a string literal (`"..."` or `'...'`), **must** add `"" +` at the beginning of expression.

```vl
$fullName = ($firstName + " " + $lastName)
$priceDisplay = ("" + "¥" + $price)
```

7. **Call PIPE functions**:

- Example: `_inputValue._trim()._toUpperCase()`

8. **Call variable built-in immutable methods**:
   These methods **cannot modify original data**, but return new processed results.

**Example:**

```vl
- _isValid(BOOL) = /^\d+$/.test($inputValue)
```

9. **Use arrow functions (`=>`) as callbacks**:
   When system default immutable methods (like `filter`, `map`) need callback functions, **must** use arrow function (`=>`) syntax. **Strictly forbidden** to use `function` keyword in expressions to define callbacks; **only limited to callbacks for JS built-in immutable prototype methods**;

   ```vl
   // Correct approach:
   -_filteredOptions([{value:INT,label:STRING}]) = $stockOptions.filter( (item) => item.value > 10 )
   -_firstMatchingOption({value:INT,label:STRING}) = $stockOptions.filter( (option) => option.value === 100 )[0]
   ```

#### Core Forbidden Rules

**1. Absolutely Forbidden to Call METHOD in Expressions**

Any method defined with `METHOD` or `METHOD_PUB` cannot be called in expressions:

```vl
# ❌ Incorrect examples
<If-Check> conditions:(validateData())  # validateData is METHOD
<Text-Result> value:calculateTotal()    # calculateTotal is METHOD
$summary(STRING) = generateReport()     # generateReport is METHOD

# ✅ Correct approach: Use PIPE function instead
PIPE _validateData(); RETURN BOOL
-RETURN ($formData.name != "" && $formData.email != "")

<If-Check> conditions:$formData._validateData()
```

**Reason**: METHOD may contain side effects (like modifying variables, calling services); calling in expressions leads to unpredictable behavior and performance issues.

#### Parentheses Rules in Expressions

**General Principle**:

All expressions with operators must have parentheses. Otherwise don't use them.

```vl
$message = ($age >= 18) ? "Adult" : "Minor"
<StateStyle-EmptyState> conditions:(!$hasData)
<Text-Time> value:_item0.time
```

### Complex Expression Examples (Including Loop Variables)

```vl
# Access loop item properties
_item0.name
_user.profile.avatar

# Conditional judgment on loop item properties
_item0.status == "active" ? "Online" : "Offline"

# Combine loop index and loop item
("" + "Index:" + (_index0 + 1) + ", Name:" + _item0.name)
```

(Loop variable naming conventions: see "Variable Naming Rules" section.)

## Logic Writing Basic Rules

### Unidirectional Data Flow Rules (Strictly Follow)

**Downstream data is uniquely determined by upstream data.** Downstream cannot be independently modified or reverse-modify upstream.

| Upstream → Downstream | Rule | Error Example |
|----------------------|------|---------------|
| Variable → Component Property | Modify the variable, not the property. Input components require explicit `@change` writeback (no v-model). | `<Input>.value = "x"` ❌ |
| Global Variable → Derived Variable | Derived vars are computed from globals; cannot be assigned in methods. | `$userCount = $users.length + 1` ❌ |
| Loop Data Source → Loop Variable | Loop vars cannot be independently modified; modify the source array. | `_item0.checked = true` ❌, use `$list[_index0].checked = true` ✅ |
| Parameter Declaration → Parameter Usage | Parameters are read-only (see Parameter Read-Only Principle above). | `inputList.push(x)` ❌ |

### Conditional Judgment Usage Rules (`IF / ELSE IF / ELSE`)

`IF` statement is used for conditional branching based on **boolean expressions**, can handle more complex conditional logic.

**Indentation Rules:**

- `IF booleanExpression` statement maintains **same indentation** as current line in its code block (e.g., `-`).
- `ELSE IF booleanExpression` and `ELSE` keywords also maintain **same indentation** as `IF` (e.g., `-`).
- Code blocks inside `IF`, `ELSE IF`, `ELSE` are **one level deeper** than their keywords (e.g., `--`). Nested `IF` continues increasing indentation.

```
-IF condition1
--execution block 1
---IF nested condition 1.1
----...
-ELSE IF condition2
--execution block 2
---...
-ELSE
--default execution block
---...
```

**Example 1: Simple IF/ELSE**

```vl
METHOD checkAge(age(INT)); RETURN {canVote:BOOL}
-IF age >= 18
--RETURN {canVote:true}
-ELSE
--RETURN {canVote:false}
```

**Example 2: IF / ELSE IF / ELSE Nested**

```vl
# Frontend Internal Methods

PIPE _extractTypes(input([{type:STRING, name:STRING}]));RETURN [STRING]
-_types([STRING]) = []
-_seen({}) = {}
-FOR (_item0, _index0) IN input
--IF !_seen[_item0.type]
---_seen[_item0.type] = true
---_types.push(_item0.type)
---IF _item0.type == "INT"
----_types.push("INT")
---ELSE IF _item0.type == "BOOL"
----_types.push("BOOL")
--ELSE IF _item0.type == "STRING"
---_types.push("STRING")
---IF _item0.type == "INT"
----_types.push("INT")
---ELSE
----_types.push("STRING")
--ELSE
---_seen[_item0.type] = true
-RETURN _types
```

### Loop Usage Rules (`FOR`)

VL supports three `FOR` loop structures:

- **In Frontend Component Tree (# Frontend Tree):** Use `<For>`, `<TreeFor>` and other loop structure containers to create child components in loops
- **In Method/Function Body:** Use loop syntax `FOR...IN` and `FOR(...)` for array loops and counting loops

##### 1. Loop Structure Containers in Component Tree (`<For>`, `<TreeFor>`)

See For/TreeFor component documentation for syntax and properties.

##### 2. Array Loop in Methods/Functions (`FOR ... IN`)

Use `FOR ... IN ...` keyword to traverse arrays.

**Indentation Rules:**

- `FOR (_itemVarN, _indexVarN) IN arrayVariable` statement maintains **same indentation** as current line in its code block (e.g., `-`).
- Code blocks inside loop body are **one level deeper** than `FOR` statement (e.g., `--`).
- Loop variables can be used directly without pre-definition. Naming: see "Variable Naming Rules" section.

**Syntax:**

```
-FOR (_itemVarN, _indexN) IN arrayVariable
--loop execution code
--...
```

**Example:**

```vl
METHOD calculateTotalAge(userList([{name:STRING, age:INT}])); RETURN {totalAge:INT, success:BOOL}
-_totalAge(INT) = 0
-FOR (_user0, _index0) IN userList
--_totalAge = _totalAge + _user0.age
-RETURN {totalAge:_totalAge, success:true}
```

When nesting `FOR...IN` loops, each `FOR` adds one indentation level, and loop variables `N` increment:

```vl
METHOD processCategories(categories([{name:STRING, products:[{name:STRING, price:FLOAT}]}])); RETURN {processed:BOOL}
-FOR (_category0, _index0) IN categories
--log(("Processing category: " + _category.name))
--FOR (_product1, _index1) IN _category.products
---log(("-- Processing product: " + _product.name))
-RETURN {processed:true}
```

##### 3. Counting Loop in Methods/Functions (`FOR (...)`)

Provides C/Java/JavaScript-like `for` loop structure, including initialization, condition check, and increment/decrement expressions.

**Indentation Rules:**

- `FOR (initialization; condition; increment/decrement)` statement maintains **same indentation** as current line in its code block (e.g., `-`).
- Code blocks inside loop body are **one level deeper** than `FOR` statement (e.g., `--`).
- Loop control variable is declared in initialization part, using `_varName(TYPE) = initialValue`. **Must** declare type, **no** `let` keyword. **Must** use `_` prefix + **camelCase** name (e.g., `_i`, `_j`, `_k`, `_loopCounter`).

**Syntax:**

```
-FOR (_loopVar(TYPE) = initialValue; loopCondition; incrementExpression)
--loop execution code
--...
```

- **`_loopVar(TYPE) = initialValue`**: Initialization statement, declares and initializes loop variable. **Must** include type declaration and `_` prefix.
- **`loopCondition`**: Condition for loop continuation, an expression returning `BOOL`.
- **`incrementExpression`**: Expression executed after each loop iteration, usually modifies loop variable (e.g., `_i++`, `_i--`, `_i = _i + 2`).

**Example:**

```vl
# Frontend Event Handlers

<Button-LoopDemo "loopDemoButton">.@click()
-<ClientUtils>.consoleLog("--- FOR loop 0 to 9 ---")
-FOR (_i(INT) = 0; _i < 10; _i++)
--<ClientUtils>.consoleLog(_i)

-<ClientUtils>.consoleLog("--- FOR loop with step 2 ---")
-FOR (_step(INT) = 0; _step < 10; _step = _step + 2)
--<ClientUtils>.consoleLog(_step)
```

#### Error Handling

**Use System Default Error Handling** (Recommended):

- Standard CRUD operations
- Simple data fetching
- No special error recovery logic needed

**Use `IF` Custom Judgment**

- Need different handling based on specific error types
- Need cleanup operations on errors
- Need detailed error logging

After **method calls** or **service calls**, there are two error handling approaches:

**1. System Default** — No explicit handling needed. If previous step's `success != true`, system auto-returns error and (if frontend-called) shows error toast. Prefer this unless custom logic is required.

**2. Manual `IF` Handling** — Check result and branch:

```vl
-someServiceCall() -> _result
-IF !_result.success
--$isLoading = false
--<SysUI>.showToast(("" + "Failed: " + _result.message), "error")
--RETURN
```

## Style Definition

#### Theme System (2.7)

**VL code only handles logic and layout, not visual appearance.** Visual styles (colors, borders, shadows, font sizes, font weights, etc.) are entirely managed by the Theme file (.vth). VL code must not contain visual style properties.

| Property Category | Examples | Rule |
|---------|------|------|
| Layout styles | width, height, padding, margin, flex, gap, grid | Allowed in VL code |
| Visual styles | colors, borders, border-radius, shadows, font-size, font-weight | **Forbidden** — managed by Theme |

Layout styles may reference Tokens (e.g., `padding:--spacing6`), but must not write visual properties.

**Token Priority Principle:** In VL layout code, prefer Theme Tokens (`--spacing4`, `--heightMd`) over literal values. Only use literal values when no corresponding Token exists in the project's `.vth` file.

**Style Coordinate System (`style`):**

VL uses the style space coordinate system. Components declare visual semantics via the `style` attribute; the Theme fills slot values for each dimension point.

```vl
<Button-DeleteUser "delBtn"> style:"danger|ghost|pill" value:"Delete"
```

`style` is a component attribute written outside `<>`. Its value is a `|`-separated string; each word uniquely resolves to a static dimension point. Order does not matter.

**Style Space Dimensions (Static):**

| Dimension | Purpose | Example points |
|-----------|---------|----------------|
| `intent` | Business semantic intent | `primary`, `neutral`, `danger`, `success`, `warning`, `info`, `inverse` |
| `emphasis` | Visual weight / expression mode | `filled`, `outlined`, `ghost`, `text`, `tonal` |
| `shape` | Geometric form (border-radius) | `default`, `pill`, `square`, `soft`, `sharp` |
| `surface` | Container layer / backdrop (containers only) | `solid`, `subtle`, `elevated`, `overlay` |

**`state` dimension**: Interaction state overlay (hover / active / focus / disabled / invalid). Not declared in `style`; automatically applied by the platform based on component interaction state.

`style` is **optional**. When not declared, all static dimensions are unset; no CSS is generated for those dimensions. The platform does not auto-fill default points.

**Style Priority Chain:**

| Priority | Source | Description |
|----------|--------|-------------|
| 1 (highest) | Theme Overrides | Targeted override, precise to component instance |
| 2 | Component `style` coordinate | `style:"danger|ghost|pill"` resolves to Theme slot values |
| 3 (lowest) | Platform built-in fallback | Fallback when Theme is missing or slot unset |

**Overrides syntax** (in .vth `# Overrides` section):

```vl
<Section-Checkout>.#payBtn -> success|filled|pill
<Section-LoginForm>.#infoCard box-shadow:--shadowLg
```

Syntax reuses VL's existing component reference addressing (`<Section>.#componentId`). Compile-time validation: target not found reports warning.

**Token Runtime Output:** Design Tokens are automatically output as CSS Custom Properties on `:root`:

```css
:root {
  --colorBrandPrimary: #0052D9;
  --colorBgBody: #FFFFFF;
  --spacing4: 4px;
  --radiusMd: 4px;
  --fontSizeMd: 14px;
  --shadowMd: 0 4px 12px rgba(0,0,0,0.08);
  /* ... all Tokens */
}
```

This output is automatic. VL layout properties can reference Tokens via `--tokenName` syntax.

**Token Stability Principle:** Token names once published follow "only add, never modify or delete". Token names are a cross-file public contract.

**Preset Themes:** Platform provides multiple preset Themes (Default, Enterprise, Dark, etc.) with complete Token definitions and Coordinate Values. Select one at project creation for zero-configuration use. Preset Themes do not include Overrides.

---

### Style Space Specification

#### 一、Style Space Dimension Definitions

The style space is fixed by the platform; the Theme only fills values. Dimension/point/slot names follow the stability principle: add only, never delete or rename.

##### `intent` (Static Dimension)

Purpose: Business semantic intent. Does not control geometry or layout.

| Point | Description |
|-------|-------------|
| `primary` | Primary action / primary brand semantic |
| `neutral` | Neutral / secondary semantic |
| `success` | Success / completion semantic |
| `warning` | Warning / risk semantic |
| `danger` | Danger / delete / failure semantic |
| `info` | Informational prompt semantic |
| `inverse` | Inverted color semantic (light/dark reversal) |

| Slot | Description |
|------|-------------|
| `intentFg` | Semantic foreground color |
| `intentBg` | Semantic background color |
| `intentBorder` | Semantic border color |
| `intentOnBg` | High-contrast foreground on background (e.g., white text) |
| `intentFocusRing` | Focus ring (box-shadow format) |
| `intentSubtleBg` | Muted background (tonal / light-tint scenes) |

##### `emphasis` (Static Dimension)

Purpose: Visual weight and expression mode. Does not change business semantic; only changes presentation strategy.

| Point | Description |
|-------|-------------|
| `filled` | Strong expression — semantic solid background |
| `outlined` | Medium expression — transparent background + semantic border |
| `ghost` | Weak expression — transparent background + weak/no border |
| `text` | Minimal container feel — text/icon only |
| `tonal` | Medium-weak expression — semantic light background |

| Slot | Description |
|------|-------------|
| `emphasisBg` | Background value (may reference `@intent.*`) |
| `emphasisFg` | Foreground value |
| `emphasisBorderColor` | Border color |
| `emphasisBorderWidth` | Border width |
| `emphasisTextDecoration` | Text decoration (reserved; current values all `none`) |
| `emphasisShadow` | Shadow value (reserved; current values all `none`) |

**Boundary constraints (platform-fixed):**

1. `emphasis` does not define brand/state/semantic colors (those belong to `intent`)
2. `emphasis` does not define container layer (belongs to `surface`)
3. `emphasis` does not define hover/focus/disabled triggers (belong to `state`); `state` does not define expression weight (belongs to `emphasis`)
4. Slot values only allow three types: CSS value, token reference (`--token`), cross-dimension reference (`@intent.*`)
5. Prohibit "secondary semantic words" (e.g., `solid`, `subtle`, `strong`) as final slot values

**Orthogonal relationship with `intent`:** `intent` provides semantic color sources; `emphasis` only selects which expression path to use. Cross-dimension references via `@intent.*` are allowed; hardcoding new brand semantic colors in `emphasis` is forbidden.

**`emphasis` value constraints:**
- `emphasisBorderWidth` must be a CSS length value (e.g., `0`, `1px`)
- `@intent.xxx` cannot reverse-reference `@emphasis.xxx` (circular reference is a compile error)

##### `shape` (Static Dimension)

Purpose: Geometric form (border-radius style).

| Point | Description |
|-------|-------------|
| `default` | Default border-radius |
| `pill` | Capsule shape (full radius) |
| `square` | No radius |
| `soft` | Large soft radius |
| `sharp` | Small sharp radius |

| Slot | Description |
|------|-------------|
| `shapeRadius` | Border-radius value (CSS `border-radius`) |

##### `surface` (Static Dimension — Containers Only)

Purpose: Container layer and backdrop material. Does not apply to interactive atomic components (Button / Input / Text etc.) — their background/border/shadow are controlled by `emphasis`. Exception: Divider is a structural visual element and uses `surface`.

| Point | Description |
|-------|-------------|
| `solid` | Solid backdrop |
| `subtle` | Muted backdrop |
| `elevated` | Elevated backdrop (with shadow) |
| `overlay` | Overlay backdrop (modals etc., with mask) |

| Slot | Description |
|------|-------------|
| `surfaceBg` | Container background |
| `surfaceBorder` | Container border |
| `surfaceShadow` | Container shadow |
| `surfaceBackdrop` | Mask value (only `overlay` uses this) |

##### `state` (Special Dimension)

Purpose: Interaction state overlay. Developers do not declare `state` points in `style`; the platform triggers them automatically based on component interaction state and applies them implicitly to all state-enabled components.

| Point | Description |
|-------|-------------|
| `rest` | Default state (no overlay) |
| `hover` | Hover state |
| `active` | Pressed state |
| `focus` | Focus state |
| `disabled` | Disabled state |
| `invalid` | Error state |

| Slot | Description |
|------|-------------|
| `stateOverlay` | Semi-transparent overlay color; does not replace baseline background (overlay layer) |
| `stateShadow` | Shadow override (e.g., focus ring) |
| `stateBorder` | Border color override |
| `stateOpacity` | Opacity override |
| `stateCursor` | Cursor style |
| `stateTransform` | Transform value |

**Relationship with VL StateStyle widget:** The `state` dimension replaces Theme-level StateStyle child nodes (i.e., hover/focus/disabled state styles nested in variants inside `.vth`). VL code `StateStyle` widgets with `conditions:` **continue to exist** for business-logic conditional styles (e.g., `conditions:$isHighlighted`); these represent runtime business state and are not covered by the `state` dimension.

---

#### 二、`style` Coordinate Syntax and Resolution Rules

##### Input Form

Developers use a shorthand string: `style:"danger|ghost|pill"`

The compiler splits by `|`, looks up the unique static dimension point for each word, order does not matter. The compiled output is internally normalized to a coordinate object; the object form is not exposed externally.

`style` is optional. When not declared, all static dimensions are unset and generate no CSS. The platform does not auto-fill default points for unset dimensions.

Each component type has a platform-defined set of recognized dimensions (`apply_dims`). Dimensions declared in `style` must be within that set; otherwise a compile error is reported.

Writing position: `style` is a component attribute, written outside `<>`; only the component type name and optional id are allowed inside `<>`. Example: `<Button-DeleteUser "delBtn"> style:"danger|ghost|pill" value:"Delete"`

**Global uniqueness rule for dimension points:** Static dimension point names are globally unique across the entire platform (no duplicate names across dimensions). The platform dimension dictionary must not register multiple names (aliases) for the same point; violating this constraint is a compile error.

##### Conflict Rules (Compile Errors)

1. Same dimension, multiple points (e.g., `"danger|primary"`) → error
2. Duplicate point (e.g., `"danger|danger"`) → error
3. Unknown point (not in any dimension point set) → error
4. One word matches multiple dimensions (point name not globally unique) → error
5. `state` point appears in `style` → error

##### Unset Handling (Platform-Fixed)

1. Static dimensions not declared in `style` have status: unset
2. All slots of an unset dimension return empty; no contribution to final CSS properties
3. If all sources for a CSS property are empty → that CSS declaration is not generated
4. Platform must not auto-fill default points for unset dimensions

---

#### 三、Cross-Dimension Reference Syntax and Theme Responsibility Boundary

##### `@dimension.slot` Reference Syntax

Theme slot values may reference slots of other dimensions:

- Syntax: `@dimension.slot` (e.g., `@intent.intentBg`)
- When the referenced dimension is not declared, the reference resolves to empty without affecting other sources
- Circular reference → compile error
- Missing reference → compile error

##### Theme Responsibility Boundary

The Theme only fills `DimensionPoint → Slot → Value`; it must not define or modify:

1. Component consumption matrix
2. State triggers
3. Platform compositor semantics
4. Component-recognized dimension set (`apply_dims`)
5. Platform dimension dictionary structure (adding/removing points/slots)

---

#### 四、Theme File Specification

##### File Structure (Fixed Order)

1. **Root node** (required): `<Theme-Name>`
2. **Meta section** (optional): metadata, e.g., `mode:"light"`, `base_theme:"Platform/Theme-Default-Light@1"`
3. **Design Tokens section** (recommended): token definitions following existing VL token syntax
4. **Coordinate Values section** (required): `dimension.point.slot:value` assignments
5. **Overrides section** (optional): instance-level overrides

##### Allow and Forbid

Allowed:
1. Define dimension point slot values (e.g., `intent.danger.intentBg:--colorError`)
2. Use token references (`--token`)
3. Use cross-dimension references (`@dimension.slot`)
4. Write instance-level Overrides

Forbidden:
1. Define/modify component consumption matrix
2. Define/modify state triggers
3. Modify platform dimension dictionary (add/remove points/slots)
4. Write `state` static coordinates in the Theme

##### Value Constraints (Compile Validation)

1. `dimension` / `point` / `slot` must exist in the platform dictionary
2. `value` only allows: valid CSS value, token reference (`--token`), cross-dimension reference (`@dimension.slot`)
3. Reference cycle → compile error
4. Missing reference → compile error

##### Overrides Specification

Two types of overrides:
1. Coordinate override: `<Section-Name>.#componentId -> pointA|pointB|pointC`
2. Property value override: `<Section-Name>.#componentId css-prop:value`

Priority: `Overrides > Theme coordinate values > Platform fallback`

Overrides are limited to skin properties; modifying skeleton properties (layout/size/positioning) via Override is forbidden.

---

#### 五、Compile Checks Summary

| # | Check | Level |
|---|-------|-------|
| 1 | `style` point name not in any dimension point set | error |
| 2 | `style` same dimension multiple points conflict | error |
| 3 | `style` duplicate point | error |
| 4 | `style` one word matches multiple dimensions | error |
| 5 | `state` point appears in `style` | error |
| 6 | Component `style` declares dimension outside `apply_dims` | error |
| 7 | Theme `dimension` / `point` / `slot` invalid | error |
| 8 | Cross-dimension reference cycle | error |
| 9 | Cross-dimension reference missing | error |
| 10 | `emphasisBorderWidth` is not a CSS length value | error |
| 11 | CSS property with all-empty sources outputs empty declaration | error |
| 12 | Platform dimension dictionary registers multiple names (alias) for same point | error |

---

**Dynamic Style Rules (Strict):**

- VL expressions can be used in component layout style properties, e.g.: `<Block-ProgressBar> width:("" + $progress*300 +"px")`. Note: VL expressions are only supported in regular component instances; **`StateStyle` widgets are for static style configuration and do not allow VL expressions**
- **Strictly forbidden to directly access/modify component styles in events/methods**

```
# ❌ Wrong
-<Text-Title "title">.color = "blue"
-_textColor = <Text-Title "title">.color

# ✅ Correct — bind to variable in tree, modify variable in event
<Text-Title "title"> value:"Hello" color:$color
-$color = "blue"
```

#### Compound Property Usage Rules

- **Allowed compound value properties (keep complete)**: `box-shadow`, `transform`, `clip-path`, `filter`, `text-shadow`, and `background-image` (for gradients) and `grid-template-columns/rows/areas` property values are inherently compound structures and **must** be kept in complete string form.
  - `box-shadow:0 8px 25px rgba(0,0,0,0.15)`
  - `transform:translateY(-2px) scale(1.02)`
  - `filter:blur(5px) brightness(0.8)`
  - `grid-template-columns:repeat(3, 1fr)`
- **Forbidden shorthand properties (must be split)**:
  - `background` (should be split into `background-color`, `background-image`, `background-repeat`, etc.)
  - `border` (should be split into `border-width`, `border-style`, `border-color`)
  - `font` (should be split into `font-size`, `font-family`, `font-weight`, etc.)
  - `transition` (should be split into `transition-property`, `transition-duration`, etc.)
  - `flex` (should be split into `flex-grow`, `flex-shrink`, `flex-basis`)
  - And other similar bundled shorthands.
- **Allowed multi-direction shorthands (follow "either-or" rule)**:
  - `padding`, `margin`, `overflow`, `border-radius`, `gap`
  - **"Either-or" principle**: If using these shorthand forms (like `padding:"10px"` or `padding:"10px 20px"`), **forbidden** to also use corresponding single-side properties (like `padding-left`) in same style rule set.
- **Compound Property Usage Example:**

```
// Wrong (forbidden shorthand)
<Block-Card> border:1px solid #eee
// Correct (split)
<Block-Card> border-width:1px border-style:solid border-color:#eee
```

#### **CSS Properties Forbidden in VL**:

- **Media queries (strictly forbidden)**: **Strictly forbidden** to use `@media` queries in any style definitions. VL's design philosophy is to create independent applications for each target device (PC, Phone, Pad), rather than responsive adaptation within a single application.
- **Animation keyframes**: Only **@keyframes** `animations` and **animation** `property` are not supported in VL syntax; other CSS styles are all supported.
- **display**: `display` property is entirely managed internally by components; not allowed to directly write `display:xxx`

### `<StateStyle>` Conditional Style Widget

Conditional style widget, through its Conditions and Trigger properties, can clearly specify a UI component's styles in different scenarios. Note: Conditional style widget's style definitions only support literal values and calc expressions; VL expressions are strictly restricted.

#### Components That Cannot Have Styles

The following components are pure logic containers with no DOM elements. Therefore, no style definitions can be added to these components (i.e., nothing outside angle brackets `<...>`). Consider these components "transparent" in layout, not participating in UI element layout at all. These components include: `If`, `For`, `TreeFor`, `AnimationGroup` (and other similar pure logic loop or conditional rendering components).

## Database File Rules

### Table Definition

**Example**

```vl
<Table-Users> data:[{"_id":1,"username":"user1","email":"user1@example.com","role":"Admin","status":1,"_user":"1","_create":"2024-01-15 09:30:00","_update":"2024-01-15 09:30:00"}...]
-<Field-username> type:STRING
-<Field-email> type:STRING
-<Field-role> type:STRING
-<Field-status> type:INT
```

**Rules**

- Table names use **PascalCase**, field names use **camelCase**
- `default` supports literals: strings need quotes (like `default:""`), boolean (`true|false`), numbers, time strings, etc.
- Following system fields are **automatically added during system table creation**, **forbidden to explicitly declare equivalent fields**:
  - `_id (INT)`: Auto-increment primary key, starting from 1
  - `_user (STRING)`: Records submitting user's ID
  - `_create (TIMESTAMP)`: Creation time
  - `_update (TIMESTAMP)`: Update time
- `vecSource` is vector type field specific property, specifying vector field's source data fields.
- `Index` is optional child component; index field order takes effect.
- `data` is optional property; used to initialize some test data. Initialize 3-7 rows of data based on actual requirements. Unlike normal insert/update in services, test data needs to declare system fields for testing convenience:
  - `_id` field: Required, please start from 1;
  - `_user` field: Required, if no special requirements, please fix as "1";
  - `_create`/`_update` fields: Required, if no special requirements, please fix as current time

### Relation Definition

**Format**

```
<Relation-RelationName relation1 relation2 ..>
```

**Examples**

```
<Relation-User&Profile> users._id--userProfiles.userId // One-to-one single relation
<Relation-User&Posts> users._id<<posts.authorId  // One-to-many, single relation
<Relation-User&Messages> users._id<<messages.senderId users._id<<messages.receiverId // One-to-many, multiple relations
<Relation-Departments&Employees> departments._id<<employees.departmentId departments.managerId>>employees._id // One-to-many + many-to-one dual relations
<Relation-Warehouse&Inventory> warehouses.(code,region)<<inventory.(warehouseCode,warehouseRegion) // One-to-many, single relation composite key
```

- A Relation describes all relationships between two tables; relation names should strictly follow table names. For example, `<Relation-TableName1&TableName2>`, two table names connected by `&` symbol.
- Two tables may have multiple relations
- Each relation contains Table1's field, relation symbol, and Table2's field
- Relation symbols use `--`, `<<`, and `>>` representing one-to-one, one-to-many, and many-to-one respectively
- A relation may contain composite keys. Note: Composite key's multiple fields actually represent one pointer, so use `Table1.(compositeKeyField1,compositeKeyField2...)` format; do not write as two relations.

## App (.vx) Application File Writing Supplement

### `#SysConfig` (Application System Configuration)

`.vx` application files must declare system configuration parameters in `#SysConfig` section:

```vl
# SysConfig

DEVICE_TARGET:"PC"
SCREEN_RESOLUTION:"1920x1080"
```

**Required Configuration Items:**

- **DEVICE_TARGET**: Target device type, options: "PC", "Phone", "Pad"
- **SCREEN_RESOLUTION**: Target screen resolution

## Section/Component (.sc/.cp) File Writing Supplement

### `# Frontend Public Props` (Public Property Definition)

Use frontend global variables (`$`) to define public property variables. These variables are used within the file the same way as regular global variables, but during application compilation, public property variable values can be passed in from upper-level files (App or Section).

**Definition Method:**

```vl
# Frontend Public Props
$propertyName(Type) = initialValue
```

**Example:**

```vl
# Frontend Public Props
$initialConfig({primaryColor:STRING,fontSize:INT}) = {primaryColor:"#1890ff",fontSize:14}
$initialUserId(INT) = 0
```

### `# Frontend Tree`

**Forbidden**: Absolutely forbidden to add another Section inside Section, meaning Section's Frontend Tree will NOT have statements like `<Section-ModuleName>...`.

### `# Frontend Public Events` (Frontend Public Event Definition)

In .sc/.cp files, public events can be defined, i.e., events sent from module internals to outside. These events can be listened to in application layer (.vx files) to complete inter-module/component interaction. Definition has two parts:

1. First in `# Frontend Public Events` section, top level, no indentation, use `@` symbol to define event method name:

**Definition Format:**

```
EVENT @eventName(param1(Type1),param2(Type2),...)
```

- **Parameter naming**: All parameters use **camelCase**, **without `_` prefix**.

**Example:**

```vl
EVENT @userSelected(userId(INT),userName(STRING))
EVENT @formSubmitted(formData({id:INT,timestamp:TIMESTAMP}))
EVENT @requestLogin()
```

2. Then inside .sc/.cp file's program logic (usually in event handlers or methods), define trigger logic:

```vl
<Button-Submit "submitButton">.@click()
-validateForm() -> _validation
-IF _validation.success
--@formSubmitted($formData)
-ELSE
--<SysUI>.showToast(_validation.message, "error")
```

### `# Frontend Public Methods` (Frontend Public Method Definition)

In .sc/.cp files, a method can be defined as public method using `METHOD_PUB MethodName` format.

These methods can be called from upper-level application files (.vx/.sc).

Public methods can also be called internally within the file; calling method is identical to internal methods:

```
# Frontend Public Methods

METHOD_PUB Hide();RETURN {success:BOOL}
-$isVisible = false
-@modalClosed()
-RETURN {success:true}

# Frontend Event Handlers
<Button-Close "closeButton">.@click()
-Hide() // Call method directly, don't mistake public method as root component's method
```

Note: When calling public methods internally within file, do not mistake public methods as file root component's methods. For example inside Section, **there is no call method like `<Section-MyModule>.Hide()`**.

### Calling Services in Section

Section files can call internal services (`SERVICE`) defined in ServiceDomain files under the same project.

Notes for 2.8:

- `SERVICE`: callable from Section.
- `PUBLIC_SERVICE`: external HTTP entry only; Section cannot call it directly.
- If internal/external logic needs reuse, extract shared logic into backend `METHOD`, then call it from both `SERVICE` and `PUBLIC_SERVICE`.

Calling method:

1. Add needed ServiceDomain in component tree as a functional component:

```
# Frontend Tree

<ServiceDomain-DomainName "serviceId"> // First introduce service domain component
-<Service-ServiceName1> params:(param1(Type),param2(Type)...) returns:(output1(Type),output2(Type)...) // Introduce needed internal service as component property
-<Service-ServiceName2> ... // Another internal service under service domain
```

2. In Section's event handling or methods, call internal services defined in this ServiceDomain:

```
<ServiceDomain-DomainName "serviceId">.ServiceName()
```

3. Complete Example:

```
# Frontend Tree
<ServiceDomain-Doc "docService"> // First introduce service domain component
-<Service-DeleteDocument> params:(docId(INT),deleteType(BOOL)) returns:(success(BOOL),message(STRING)) // Introduce needed service with params and returns as component properties
...

<Button-Logout "logoutButton">.@click()
-<ServiceDomain-Doc "docService">.DeleteDocument() -> _out
-<ClientUtils>.switchRoute("home")
```

## ServiceDomain (.vs) Definition Supplement

### Virtual Table Definition

Virtual tables are "intermediate clients" for backend service logic to operate real database tables. VL follows the principle of separating code logic from data source definitions; service code cannot directly operate database tables, must use VirtualTable as bridge. Use sourceField property in virtual table to specify virtual table-entity table correspondence.

**Format:**

```
<VirtualTable-TableName "componentId"> extraSpecs?:{specName1(Type):"propertyDescription"..} sourceTable:correspondingEntityMainTable
-<Field-fieldName> type:FieldType vecSource?:["virtualTableField1","virtualTableField2"] sourceField?:correspondingEntityTableField additionalProp1:value.. // Field as VirtualTable child, must have extra indentation
```

**Example:**

```vl
<VirtualTable-Users "userTable"> sourceTable:GroupUsers extraSpecs:{label(STRING):"Field Label",readOnly(BOOL):"Read Only",inputType(STRING):"Input Type"} mockData:[{..}]
-<Field-_id> type:INT label:"User ID" readOnly:true
-<Field-username> type:STRING label:"Username" inputType:"text" // No sourceField means direct association with same-named field in main table
-<Field-email> type:STRING sourceField:userEmail label:"Email" inputType:"email" // Specify sourceField to adapt when data source field differs from virtual table field name
-<Field-departmentName> type:STRING sourceField:departmentId~Departments[_id].name label:"Department Name" readOnly:true // Found via relation
-<Field-managerName> type:STRING sourceField:departmentId~Departments[_id].managerId~Employees[_id].name label:"Manager Name" readOnly:true
-<Field-_create> type:TIMESTAMP label:"Creation Time" readOnly:true // System field, needs label set in current virtual table
```

**VirtualTable Declaration**

- A VirtualTable defines a virtual table in a service domain; table names should follow VL style using **PascalCase**, e.g., `UserMessage`
- `id`: Required, please name as "xxTable", where xx is the table's independent unique name
- `sourceTable`: Bound entity table; a virtual table can only bind one entity table (main table)
- `extraSpecs`: Optional property. Defines extra properties for virtual table fields; these properties will be output as part of `structure` field during select, for extra rendering information on frontend. E.g., `{comment(STRING):"Field description",label(STRING):"Field label display",readOnly(BOOL):"Is read only"}`
- `mockData`: Virtual table test data; only set when ServiceDomain file needs standalone preview debugging

**Fields Declaration**

- Each `Field`: Defines one field of its parent virtual table. Field names should use **camelCase**, e.g., `userName`
- **Local table fields** and **foreign table fields**
  - Local table field associates with a field in current main table; if virtual table field name matches main table field name, no need to specify `sourceField` property; otherwise specify corresponding main table field via `sourceField` property
  - Foreign table field: Set a field path via `sourceField` property following entity table relations (see Field Path Writing Rules)
  - `sourceField` property supports pointing to local or foreign table field, **does not support expressions or aggregate functions**
- Field **extra properties** must first be defined in `extraSpecs`
- **Vector field**: When field type is `VEC`, must additionally specify `vecSource` property
- **System fields**:
  - `_id`, `_user`, `_create`, `_update` are system-auto-managed fields (types INT, STRING, TIMESTAMP, TIMESTAMP); can be used directly without declaring in virtual table (e.g., as select filter/sort conditions and output fields)
  - If need to set extra properties or aliases for local table system fields, can declare in virtual table fields, e.g., `Field-docId type:INT sourceField:_id label:"Creation Time" readOnly:true`
  - Whether declared or not, system fields are **read-only fields** and cannot be assigned values in insert/update

#### **sourceField Writing Rules**

- If current virtual table field binds to a field in current main table with different names, specify current main table field name in `sourceField` property, e.g., `<Field-title type:STRING sourceField:docTitle> // Virtual table field title corresponds to current main table entity field docTitle`
- If current virtual table binds to a field in another related table, use `~` jump operator, meaning "follow" Relation from current table to another table. Format: `localStartField~RelatedTable[anchorField].targetField`

  - Single jump: `<Field-departmentName> type:STRING sourceField:departmentId~Departments[_id].departmentName`
  - Multi-jump: `<Field-managerName> type:STRING sourceField:departmentId~Departments[_id].managerId~Users[_id].userName`
- Any jump must have corresponding Relation, and this Relation must be many-to-one or one-to-one, otherwise causes data expansion

**Examples**

```vl
// ✅ Multi-jump (each jump must be many-to-one >>)
sourceField:departmentId~Departments[_id].managerId~Users[_id].userName

// ❌ One-to-many jump forbidden (causes data duplication)
sourceField:_id~Orders[userId].amount  // users._id << orders.userId is <<, error
```

#### Foreign Table Field Read-Only Access Rule

When a field is a foreign table field, that field can only be read, not written.

**❌Error Example**

```vl
<VirtualTable-Orders> "orderTable" sourceTable:Orders
-<Field-productName> type:STRING sourceField:productId~Products[_id].name // Foreign table field
-<Field-quantity> type:INT // Local table field

SERVICE CreateOrder(productId(INT),quantity(INT),productName(STRING));RETURN {success:BOOL,orderId:INT}
-_orderData({productId:INT,quantity:INT,productName:STRING}) = {productId:productId,quantity:quantity,productName:productName} // ❌ Error! productName is foreign table field, cannot be written
-<VirtualTable-Orders "orderTable">.insert(_orderData) -> _result
-RETURN {success:true,orderId:_result.dataId}
```

### `# Services` (Backend Service Definition)

In `.vs` files, backend services are defined under `# Services`. Two service types exist with distinct call boundaries:

| Type | Entry | Callable from Section | External HTTP |
|------|-------|-----------------------|---------------|
| `SERVICE` | Internal service | ✅ Yes | ❌ No |
| `PUBLIC_SERVICE` | Public HTTP service | ❌ No | ✅ Yes |

- `SERVICE ServiceName(...)`: internal service, callable from Section via `<ServiceDomain-DomainName "serviceId">.ServiceName()`.
- `PUBLIC_SERVICE ServiceName(...);RETURN ReturnType;EXPOSE {method:STRING,receive:STRING,response:STRING}`: public HTTP service, external-only entry. Section cannot call `PUBLIC_SERVICE` directly.

Endpoint rule for `PUBLIC_SERVICE`:

```
{METHOD} /xxx/{servicedomainname}/{servicename}
```

`/xxx` is project/user-defined prefix; domain and service segments are lower-case.

`EXPOSE` defaults:

- `method`: `"POST"` (options: `GET|POST|PUT|PATCH|DELETE|UNLIMITED`)
- `receive`: `"JSON"` (options: `JSON|STRING`)
- `response`: `"JSON"` (options: `JSON|XML|TEXT`)

Request parameter mapping:

- `receive:"JSON"`
  - `GET` / `DELETE`: params come from query
  - `POST` / `PUT` / `PATCH`: params come from JSON body
  - `UNLIMITED`: prefer JSON body, fallback to query
- `receive:"STRING"`
  - raw request body is passed as a single string input
  - recommended to define only one `STRING` parameter; otherwise runtime should raise parameter-mapping error

Return rules in 2.8:

- Both `SERVICE` and `PUBLIC_SERVICE` use `RETURN`.
- `PUBLIC_SERVICE` with `response:"JSON"` does **not** require internal wrapper fields such as `success/message`; response contract is defined by external API requirements.

Custom HTTP response termination:

```
CUSTOM_RETURN {statusCode:INT,headers:{},contentType:STRING,body:ANY}
```

- Available in both `SERVICE` and `PUBLIC_SERVICE`.
- `CUSTOM_RETURN` terminates current execution path immediately.
- `RETURN` and `CUSTOM_RETURN` may exist in different branches, but one path can hit only one terminal statement.
- all fields are optional; when omitted, defaults follow normal response mapping (`statusCode:200` by default)

Cookie API in service:

```
SET_COOKIE {name:STRING,value:STRING,path:STRING,domain:STRING,maxAge:INT,expires:TIMESTAMP,httpOnly:BOOL,secure:BOOL,sameSite:STRING}
```

- Available in both `SERVICE` and `PUBLIC_SERVICE`.
- `name` and `value` are required.
- Default values: `path:"/"`, `httpOnly:true`, `secure:true`, `sameSite:"Lax"`.
- Delete cookie: `SET_COOKIE {name:"sid",value:"",maxAge:0,path:"/"}`.
- `SET_COOKIE` is effective only in HTTP request context; in non-HTTP context runtime should report an error.

Recommended reuse pattern:

- extract shared business logic into backend `METHOD`
- keep `SERVICE` as internal entry
- keep `PUBLIC_SERVICE` as external entry

Example (`PUBLIC_SERVICE` — GET with TEXT response):

```vl
PUBLIC_SERVICE VerifyWebhook(token(STRING));RETURN STRING;EXPOSE {method:"GET",receive:"JSON",response:"TEXT"}
-IF token == "abc"
--RETURN "challenge-123"
-RETURN "forbidden"
```

Example (`PUBLIC_SERVICE` — 302 redirect using `CUSTOM_RETURN`):

```vl
PUBLIC_SERVICE RedirectToLogin();RETURN STRING;EXPOSE {method:"GET",receive:"JSON",response:"TEXT"}
-CUSTOM_RETURN {statusCode:302,headers:{"Location":"https://example.com/login"},body:""}
```

Example (`SERVICE` — login with `SET_COOKIE`):

```vl
SERVICE Login(user(STRING),pwd(STRING));RETURN {success:BOOL}
-auth(user,pwd) -> _r
-IF !_r.success
--RETURN {success:false}
-SET_COOKIE {name:"sid",value:_r.sessionId,httpOnly:true,secure:true,sameSite:"Strict",maxAge:86400}
-RETURN {success:true}
```

Example (`PUBLIC_SERVICE` — webhook with `SET_COOKIE`):

```vl
PUBLIC_SERVICE Webhook(raw(STRING));RETURN STRING;EXPOSE {method:"POST",receive:"STRING",response:"TEXT"}
-SET_COOKIE {name:"traceId",value:"abc123",httpOnly:false,maxAge:300}
-RETURN "ok"
```

Example (reuse pattern — shared logic via `METHOD`, separate internal and external entries):

```vl
METHOD _handleOrder(orderId(INT));RETURN {success:BOOL,data:{}}
-...
-RETURN {success:true,data:_r}

SERVICE GetOrder(orderId(INT));RETURN {success:BOOL,data:{}}
-_handleOrder(orderId) -> _ret
-RETURN _ret

PUBLIC_SERVICE GetOrderWebhook(orderId(INT));RETURN STRING;EXPOSE {method:"POST",receive:"JSON",response:"TEXT"}
-_handleOrder(orderId) -> _ret
-RETURN "ok"
```

Compatibility notes:

- 2.7 `SERVICE + RETURN` semantics remain unchanged in 2.8.
- 2.8 engine is backward-compatible with 2.7 code.
- 2.7 engine is not forward-compatible with 2.8 additions (`PUBLIC_SERVICE` / `EXPOSE` / `CUSTOM_RETURN` / `SET_COOKIE`).

### `# Backend Event Handlers` (Backend Event Listeners)

Backend message-type component message handling logic definitions. For example `<ServerWSClient>`, `<MQ>` message events. Example:

```
# Backend Event Handlers
<MQ-DataPipe "dataTransform">.@message(rawData,dataType)
-convertData(rawData,dataType) -> _result
-log(_result)
```

### `# Transactions` (Database Transaction Definition)

Define a database operation transaction; rollback operations are supported within transactions. Example:

```
# Transactions
TRANSACTION txTransferMoney(fromId(INT), toId(INT), amount(FLOAT)); RETURN {success:BOOL, message:STRING}
-<VirtualTable-Accounts "accountTable">.select([["_id","eq",fromId]]) -> _fromAccount
-IF _fromAccount.dataArray[0].balance < amount
--ROLLBACK {success:false, message:"Insufficient balance"}
-<VirtualTable-Accounts "accountTable">.update([["_id","eq",fromId]], [["balance","inc",-amount]], 1) -> _updateFrom
-<VirtualTable-Accounts "accountTable">.update([["_id","eq",toId]], [["balance","inc",amount]], 1) -> _updateTo
-RETURN {success:true, message:"Transfer successful"}
```

- Naming uses camelCase prefixed with `tx`
- Use ROLLBACK keyword to rollback transaction
- Transaction usage is identical to internal methods; cannot be called directly from frontend like services

**Call Example**

```
# Calling transaction in Service
SERVICE TransferMoney(fromUserId(INT), toUserId(INT), amount(FLOAT)); RETURN {success:BOOL, message:STRING}
-txTransferMoney(fromUserId, toUserId, amount) -> _result
-RETURN _result
```

### `# Backend Internal Methods` (Backend Internal Method Definition)

Define backend internal methods, prefixed with METHOD; format is identical to frontend internal methods.

## User Login and Permission Control

### Identity Trust Boundary

`SYSENV.currentUser` is available in both frontend and backend, but carries fundamentally different trust levels:

| Scope | Data Source | Trust Level | Permitted Uses |
|-------|-------------|-------------|----------------|
| Frontend | Parsed from client-side token | **Untrusted** (can be forged) | UI display (username, avatar, etc.); login state check (`isLogin`); frontend-only UI condition control |
| Backend SERVICE | Read from Redis at runtime, verified by TokenIssuer | **Trusted** | All logic that determines "who is performing this action" — data writes, permission checks |

**The backend `SYSENV.currentUser` is the only trusted source of user identity in the VL platform.**

#### User Center

VL system uniformly provides User Center application; any project will automatically bind a User Center without specifying in VL. User Center provides:

- User registration, login
- User information editing
- Admin user management (user list viewing, user disable/deactivation)
- Admin user permission configuration (ABAC combined with RBAC permission management system, configurable resource groups, manage resource group access rules, etc.)

#### Application Interaction with User Center

In frontend applications, `<ClientUserCenter>` component can be used to call User Center interface methods for frontend custom login interface related functionality.

Frontend and backend applications can both use `SYSENV.currentUser` to get current logged-in user information.

#### Login Mode Decision Matrix

| Decision Dimension | Mode 1 (ClientUserCenter / User Center managed) | Mode 2 (Custom Login + TokenIssuer) |
|---|---|---|
| User and credential ownership | User Center | Project-owned store or third-party identity system |
| Where credential verification runs | Built-in User Center flow | Project backend SERVICE (can integrate external SSO/IdP) |
| Login UI shape | Can redirect to default login page; can also use a project-custom UI that calls ClientUserCenter | Project-custom UI |
| Token issuance | Completed internally by User Center | Backend must call `TokenIssuer.generateLoginToken` |
| Default recommendation | Yes (when there is no explicit external authentication requirement) | No (only when user data/authentication is not managed by User Center) |

**Normative Rule**

- A custom login UI is not the deciding factor between Mode 1 and Mode 2.
- Mode 2 is selected only when authentication and user data are not managed by User Center.

#### Standard Login Patterns

**Mode 1: ClientUserCenter (User Center managed)**

Use when user data and authentication logic are managed by the User Center. The project only builds the UI trigger; all authentication is handled internally by the User Center.

```vl
# Frontend Tree
<ClientUserCenter "userCenter">

<Page-Home "home"> path:"home"
-<If-NotLogin> conditions:(!SYSENV.currentUser.isLogin)
--<Button-Login "loginBtn"> value:"Login"

# Frontend Event Handlers
<Page-Home "home">.@init()
-IF !SYSENV.currentUser.isLogin
--<userCenter>.redirectToLogin()

<userCenter>.@loginDone()
-<ClientUtils>.refreshCurrentUser()
```

**Mode 2: Custom Login (project-managed, TokenIssuer)**

Use when user data is managed by the project itself, or authenticated via a third-party system. The project builds its own authentication SERVICE; after identity is verified (by any means — querying a local table, calling an external SSO, invoking a third-party API, etc.), it must call `TokenIssuer.generateLoginToken` to issue the token. The frontend does not participate in token generation.

```vl
// Backend SERVICE: verify identity (by any means) then issue token
SERVICE UserLogin(username(STRING), password(STRING));RETURN {success:BOOL, message:STRING}
// Verify identity here — query local table, call external SSO, invoke third-party API, etc.
-// ... identity verification logic ...
-// On failure: RETURN {success:false, message:"Authentication failed"}
-<TokenIssuer>.generateLoginToken(_userId, "default", {}, {username:username}, 5) -> _tokenResult
-IF !_tokenResult.success
--RETURN {success:false, message:_tokenResult.message}
-RETURN {success:true, message:""}

// Frontend: refresh identity after login success
<Button-Submit "submitBtn">.@click()
-<ServiceDomain-Auth>.UserLogin($username, $password) -> _r
-IF !_r.success
--<SysUI>.showToast(_r.message, "error")
--RETURN
-<ClientUtils>.refreshCurrentUser()
```

#### Logic NOT Allowed in Applications

Entity tables, virtual tables, services, frontend element access permissions in applications will be set by administrators or an independent AI agent in User Center management interface; therefore **please do not hardcode any user permission-related logic in code**, including:

- Whether a service can be accessed
- Data access scope restrictions, e.g., whether can only access self-created data, or can access current department, or global data; these restrictions will be configured directly in User Center, project code should not have user-based data filtering logic
- Whether a page can be accessed
- Whether a table or field can be accessed, can be updated, etc.

Example:

```vl
// Error: Hardcoding user-related filter logic in code
<messageTable>.select([["_user","eq",SYSENV.currentUser.userId]],[["_update","desc"]],[offset,limit],null) -> _result

// Correct: Code only handles business logic; user-related data scope permissions left to permission configuration module
<messageTable>.select(null,[["_update","desc"]],[offset,limit],null) -> _result
```

**Forbidden: passing frontend user identity to backend SERVICE as the current operator.**

The current operator's identity must always be read from `SYSENV.currentUser` inside the backend SERVICE. The frontend must not read `userId` (or any other identity field) from `SYSENV.currentUser` and pass it as a parameter to a SERVICE for the purpose of identifying who is performing the operation.

```vl
// ❌ Error: frontend reads userId and passes it into SERVICE
$userId(STRING) = SYSENV.currentUser.userId
<ServiceDomain-Order>.CreateOrder($userId, $orderData) -> _r

// ❌ Error: SERVICE accepts userId as parameter for the current operator
SERVICE CreateOrder(userId(STRING), orderData({}));RETURN {success:BOOL}
-<orderTable>.insert({creatorId:userId, ...orderData}) -> _r

// ✅ Correct: frontend passes no identity; SERVICE reads from SYSENV internally
<ServiceDomain-Order>.CreateOrder($orderData) -> _r

SERVICE CreateOrder(orderData({}));RETURN {success:BOOL}
-<orderTable>.insert({creatorId:SYSENV.currentUser.userId, ...orderData}) -> _r
```

**Exception**: Admin operations that act on another user's data (e.g., an admin modifying a target user's record) may accept a `targetUserId` parameter. This must be clearly named `targetUserId` (not `userId`) to distinguish it semantically from the current operator.

### Default Platform Behavior: Write Operations Require Login

When a SERVICE contains any db write operation (`insert` / `update` / `delete`), the runtime automatically requires the request to be authenticated. Unauthenticated requests are rejected at the SERVICE entry point with a 401 error, before any logic executes.

**Judgment scope**:

- Each SERVICE is evaluated **only at its own entry point** — no static analysis of the call chain is performed.
- If SERVICE A (read-only) calls SERVICE B (contains writes), B enforces the login check at its own entry. A's already-executed read operations have no side effects; the failure propagates up the call chain and A returns an error.
- Pure read operations (`select` / `count`) are **not** subject to this rule. Their access control is managed by the project-level resource permission configuration layer.

**Override**: Projects may explicitly override this default behavior via the resource permission configuration layer (e.g., to permit anonymous writes to a specific SERVICE). This rule acts as the platform's secure-by-default fallback when no permission configuration exists.

## VL Generation Hard Rules (MUST / MUST NOT)

### 1. Widget Mounting Rules

- **MUST**: `StateStyle/Animation/UseDraggable/UseDropTarget/...` widgets can only be mounted under UI-bearing components (Basic UI / Layout Containers / Frontend Root Components).
- **MUST NOT**: Widgets cannot be placed directly under logic containers like `If/For/TreeFor`; nor under non-UI functional components like `Trigger/FrontendApi/WindowEventListener/ClientUserCenter`.

### 2. Logic Container Restrictions

- **MUST NOT**: Logic containers have no UI, cannot have styles (nothing outside angle brackets), have no id, and cannot be accessed in subsequent code.

### 3. Define Before Use

- **MUST**: All `$variables` must be declared in `Public Props / Global Vars / Derived Vars` before being referenced.
- **MUST**: Except for system method classes, any component instance must first appear in `# Frontend Tree` before being called. Specifically, `Trigger/FrontendApi/WindowEventListener/ClientUserCenter` must also be declared first.

### 4. Public Events

- **MUST**: Any public event exposed externally must be declared with `EVENT` in `# Frontend Public Events` before being triggered; event names use camelCase.

### 5. Expression / Derived Variable Computation

- **MUST**: Expressions and Derived Vars can only use pure expressions and `PIPE _xxx()` functions.
- **MUST NOT**: Call `METHOD` in expressions or Derived Vars.

### 6. Component Reference Name Strict Matching

- **MUST**: In `.vx` files, `<Section-xxx>` / `<Component-xxx>` where `xxx` must exactly match the corresponding file's root component name; do not substitute component name with id.
- **MUST**: App does not directly access internal child component instances of Section/Component; communicate only through Public Props/Events/Methods.

### 7. Trigger Properties and Units

- **MUST**: Trigger only uses `repeatTimes / interval(seconds) / autoPlay / isAnimate`; invented properties like `active` are forbidden.
- **MUST**: Units are strict: `Trigger.interval` = seconds; `ClientUtils.delay` = milliseconds; `SysUI.showToast.duration` = seconds.

### 8. App (.vx) Structure (Per Current Editor Version)

- **MUST**: `.vx` files do not generate Stage; Page must be a direct child node of App root component.
- **MUST NOT**: Forbidden to generate `Stage.@routeChange` and other Stage events.
- **MUST**: Route entry logic goes in `Page.@init()`; if browser events need to be monitored, use `WindowEventListener` (event names in camelCase).

---

# VL Basic Components Reference

## 1. Frontend Components

Frontend components can be used in Section, Component, and App files. Note that some components can only be used in Section/Component or only in App. Components without special notes can be used in both Section/Component and App.

### Frontend Functional Components (No UI)

All functional components, although having no UI, can have multiple instances and **must be defined in `# Frontend Tree` (component tree) before use**.

#### Trigger (Frontend Timer Trigger)

Frontend timer trigger component.

**Properties:**

- `repeatTimes(INT)`: Sets the maximum number of times the trigger can fire. Set to **-1** for infinite playback. Default value is **-1**.
- `interval(FLOAT)`: Sets the time interval between trigger fires in seconds. When empty string `""`, fires every frame (depends on device refresh rate, typically 1/40s or 1/60s), approximating continuous triggering.
- `autoPlay(BOOL)`: Controls whether the trigger auto-plays. Set to true to enable, false to disable. Default is false (no auto-play).
- `isAnimate(BOOL)`: Animation optimization: enabled by default when using trigger for animations. When enabled, trigger uses requestAnimationFrame to auto-adapt to device frame rate for optimal animation. When disabled, trigger fires strictly at setTimeout-defined intervals, suitable for features that need to run in inactive browser tabs.

**Methods:**

- `play()`: Activates trigger playback. If not playing (or reset), starts from beginning; if paused, continues from pause point.
- `pause()`: Pauses current playback. When resumed, continues from pause position.
- `stop()`: Stops trigger and resets to initial state, clearing all playback progress and pause state.

**Events:**

- `@tick(counts, interval, duration)`: Fires when trigger activates, can add any actions to execute when triggered.

#### WindowEventListener (Browser Window Event Listener)

Listens to all events supported by the window object. Note: All events should use React-style camelCase naming, e.g., `@keyDown()`, `@hashChange()`, `@beforeUnload()`

#### FrontendApi (Frontend API Request Client, Section/Component Only)

Frontend API request client component. This component has no UI and is only used to encapsulate API request configuration and trigger logic.

**Properties:**

- `url(STRING)`: Required. API URL, supports path parameters like `/users/{id}`
- `method(STRING)`: Optional. HTTP method, defaults to "GET"
- `headers(OBJECT)`: Optional. Default request headers
- `timeout(INT)`: Optional. Request timeout duration (seconds)
- `params:(...)`: Optional. Parameter type declarations for send() method, e.g., `params:(page(INT),size(INT))`
- `returns:(...)`: Optional. Return value type declarations, e.g., `returns:(success(BOOL),data([{}]))`

**Methods:**

- `send(param1, param2, ...)` - Smart parameter allocation (recommended)

  - **Description**: Automatically allocates parameters based on HTTP method
  - **Allocation Rules**:

    - GET/DELETE: All parameters → URL query parameters
    - POST/PUT/PATCH: All parameters → Request body
    - Path parameters (like `{id}` in URL): Automatically identified and replaced
  - **Return Value**: `{success(BOOL), message(STRING), data(JSON)}`
  - **Examples**:

    ```vl
    <FrontendApi-GetUsers "getUsersApi"> url:"/api/users" method:"GET" params:(page(INT),size(INT)) returns:(success(BOOL),users([{}]))

    <Button-Load "loadButton">.@click()
    -<FrontendApi-GetUsers "getUsersApi">.send(1, 20) -> _result
    # Actual request: GET /api/users?page=1&size=20
    ```

    ```vl
    <FrontendApi-CreateUser "createUserApi"> url:"/api/users" method:"POST" params:(name(STRING),email(STRING)) returns:(success(BOOL),userId(INT))

    <Button-Create "createButton">.@click()
    -<FrontendApi-CreateUser "createUserApi">.send("John Doe", "JohnDoe@gmail.com") -> _result
    # Actual request: POST /api/users, Body: {"name":"John Doe","email":"JohnDoe@gmail.com"}
    ```

    ```vl
    <FrontendApi-UpdateUser "updateUserApi"> url:"/api/users/{id}" method:"PUT" params:(id(INT),name(STRING)) returns:(success(BOOL))

    <Button-Update "updateButton">.@click()
    -<FrontendApi-UpdateUser "updateUserApi">.send(123, "Jane Doe") -> _result
    # Actual request: PUT /api/users/123, Body: {"name":"Jane Doe"}
    ```
- `customSend(headers?, body?, params?, url?, timeout?, method?)` - Full customization

  - **Description**: For complex scenarios requiring fine-grained control over request parameters
  - **Parameters**:

    - `headers(OBJECT)`: Optional. Custom request headers
    - `body(JSON)`: Optional. Request body
    - `params(OBJECT)`: Optional. URL query parameters
    - `url(STRING)`: Optional. Override default URL
    - `timeout(INT)`: Optional. Override default timeout
    - `method(STRING)`: Optional. Override default method
  - **Return Value**: `{success(BOOL), message(STRING), data(JSON)}`
  - **Example**:

    ```vl
    <FrontendApi-SearchUsers "searchApi"> url:"/api/users/search" method:"POST" returns:(success(BOOL),users([{}]))

    <Button-Search "searchButton">.@click()
    -<FrontendApi-SearchUsers "searchApi">.customSend(null, {keyword:"John Doe"}, {page:1,size:20}, null, null, null) -> _result
    # Actual request: POST /api/users/search?page=1&size=20, Body: {"keyword":"John Doe"}
    ```

**Core Usage Rules**

- Only use `customSend` when `send` method cannot meet requirements, **limited to** these scenarios:
  - POST/PUT/PATCH needs URL parameters
  - Additional header parameters needed
  - Dynamic URL or request method needed

#### ClientUserCenter (User Center Client)

Frontend user center client. Must be declared in component tree, e.g., `<ClientUserCenter-UserAuth>`. Typically only one instance is needed per file.

**Methods:**

- `userLoginPassword(userName, password)`: Username/password login
  - Parameters:
    - `userName(STRING)`: Username
    - `password(STRING)`: Password
  - Return Value:
    - `isSuccess`
    - `failReason`
- `userLogout()`: Logout
  - Return Value:
    - `isSuccess`
    - `failReason`
- `jumpToUserCenter()`: Navigate to user center
- `sendRegistrationSMS(phoneNumber)`: Send SMS verification code
  - Parameters:
    - `phoneNumber(STRING)`: Phone number
  - Return Value:
    - `isSuccess`
    - `failReason`
- `registerUser(userName, password, verificationCode, phoneNumber)`: Register user
  - Parameters:
    - `userName(STRING)`: Username
    - `password(STRING)`: Password
    - `verificationCode(STRING)`: SMS verification code
    - `phoneNumber(STRING)`: Phone number
  - Return Value:
    - `isSuccess`
    - `failReason`

**Events:**

- `@loginDone()`: Triggered when login completes

### Basic UI Components (Section/Component Only)

All basic UI components can only be added in Section/Component, not in App.

**!!Note:** Except for `<ButtonContainer>`, all other basic UI components **cannot have child components**!

**!!Note:** The "Fixed CSS styles" section is **descriptive only**; **`display` cannot be overwritten in VL code**;

#### Text (Basic Text)

**Properties:**

- `value(STRING)`: Text content

**Fixed CSS styles:**

display: block

#### Button (Basic Button)

**Properties:**

- `value(STRING)`: Button text
- `disabled(BOOL)`: Whether disabled

**Fixed CSS styles:**

- display: inline-block

#### ButtonContainer (Button Container)

Create composite buttons by adding child components, such as an Icon and Text forming a button. Note: ButtonContainer itself cannot set the value property; all content is rendered through its child components.

**Properties:**

- `disabled(BOOL)`: Whether disabled

**Fixed CSS styles:**

- display: inline-flex

##### Button Component Usage Notes

Correct VL form:

```vl
-<ButtonContainer-PrevMonthBtn "preMonthButton"> ariaLabel:"Previous Month"
--<StateStyle-PrevBtnHover> trigger:"hover" background-color:"#f5f5f5"
--<Row-Center>
---
```

Button component cannot have child components; use ButtonContainer instead.

#### Image (Basic Image)

**Properties:**

- `sourceUri(STRING)`: Image resource URL. For placeholder images, please use **unsplash.com** image URLs uniformly in `<Image sourceUri:"...">`.

**Fixed CSS styles:**

display: inline-block

#### Video (Basic Video)

**Properties:**

- `sourceUri(STRING)`: Video resource URL (please use legitimate external resource URLs per VL standards)

**Fixed CSS styles:**

display: inline-block

#### Divider (Divider Line)

Visual element for separating content.

**Properties:**

- `orientation(STRING)`: Divider direction, options: "horizontal", "vertical", defaults to "horizontal".

**Fixed CSS styles:**

display: block

#### Input (Basic Input)

Basic text input.

**Default CSS styles:**

display: inline-block

**Properties:**

- `value(STRING)`: Input content. **Note: This property is mainly for setting initial values and does not reflect real-time user input.**
- `disabled(BOOL)`: Whether input is disabled
- `type(STRING)`: Basic input, only supports these types: text, email, password, number, url, tel. For other input types, use corresponding extended components.

**Events:**

- `@change(newValue, oldValue)`: Triggered when input loses focus and content differs from when it gained focus. Emits old and new values.
- `@focus()`: Triggered when input gains focus
- `@blur(current)`: Triggered when input loses focus
- `@input(newValue, delta)`: Triggered when input content changes
- `@clickOutside()`: Triggered when clicking outside the input area

#### Textarea (Multi-line Input)

Basic multi-line input component.

**Properties:**

Same as basic single-line input.

**Events:**

Same as basic single-line input.

**Default CSS styles:**

display: inline-block

#### Icon (Icon)

For rendering SVG, external resource URLs, or Font Awesome library icons. All icons should use this component uniformly. Icon resources can come from svgCode, url, or Font Awesome (`fontSet+content`), with priority: **svgCode > url > fontSet+content**.

**Properties:**

- `svgCode(STRING)`: Directly specify SVG code
- `url(STRING)`: External resource URL, VL internally uses HTML mask functionality to convert it to an icon

* `fontSet(STRING)`: Font Awesome icon library, options:
  - fa-solid-900
  - fa-regular-400
  - fa-brands-400
* `content(STRING)`: Font Awesome icon's **Unicode character code**, e.g., `"f170"`. **Note**: This value **must** be the icon's Unicode code, **not** a CSS class name (like `"fas fa-book"`) or icon name (like `"book"`). If set incorrectly, the icon won't display and you may see text like "OOK".

**Fixed CSS styles:**

display: inline-block

**Notes:**

- When icon content is specified via svgCode or url, size should be set via CSS width/height properties
- When icon content is specified via fontSet+content, it's essentially text, so size should be set via CSS font-size property (CSS styles go outside angle brackets), e.g., `<Icon-User> fontSet:"fa-solid-900" content:"f007" font-size:"16px"`

#### Chart (Chart)

Chart visualization component.

**Properties:**

- `option({})`: Standard ECharts option configuration for chart rendering. Example data:

  ```json
  {
    "title": { "text": "Data Analysis Chart", "left": "center" },
    "tooltip": { "trigger": "axis" },
    "xAxis": {
      "type": "category",
      "data": ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
    },
    "yAxis": { "type": "value" },
    "series": [
      {
        "name": "Visits",
        "type": "line",
        "data": [150, 230, 224, 218, 135, 147, 260],
        "itemStyle": { "color": "#5470c6" }
      }
    ]
  }
  ```

When option is assigned this data, it creates a weekly visits line chart.

#### MarkdownEdit (Markdown Editor)

Component for editing Markdown format text. Note: The markdown editor has a built-in toolbar (such as font, heading, embed tool icons), so there's no need to implement the toolbar from UI designs separately.

**Properties:**

- `value(STRING)`: Editor's Markdown text content
- `disabled(BOOL)`: When true, editing is disabled. Default is false
- `placeholder(STRING)`: Text hint displayed when content is empty

**Events:**

- `@change(newValue, oldValue)`: Triggered after blur when content differs from before.
- `@focus()`: Triggered when editor gains focus
- `@blur()`: Triggered when editor loses focus
- `@select(value)`: Triggered when text is selected in editor

#### Markdown (Markdown Renderer)

Component for rendering Markdown text as HTML and displaying it.

**Properties:**

- `value(STRING)`: Markdown text content to render

### Layout Container Components

**display Rules**: All containers' `display` is controlled internally by components; **forbidden** to set directly via style properties.

! All layout containers are for layout only, have no value property, and cannot contain inline text.

#### Block (Basic Layout Container)

Layout container with display: block.

#### Modal (Modal Layer)

Modal consists of an **outer full-screen flex container** and an **inner block content container**: the outer handles overlay and positioning, its `display` cannot be changed; the inner hosts content (block). Note: Width, height, background-color and other style properties added to Modal component only control the inner container's dimensions. The outer flex container is a full-screen container (serving as overlay) and cannot have width, height, color, or other CSS styles set.

**Properties:**

- `mask(BOOL)`: Whether to enable background overlay. If enabled, automatically generates a full-screen overlay, default overlay color is black (#000000)
- `maskColor(STRING)`: When background overlay is enabled, overlay color can be set. Default is black #000000
- `placement(STRING)`: Banner position relative to current window, options: "topLeft", "topCenter", "topRight", "middleLeft", "middleCenter", "middleRight", "bottomLeft", "bottomCenter", "bottomRight". Default is "middleCenter"

**Special Events:**

- `@clickMask()`: Triggered when clicking the component's overlay layer (requires "Background Overlay" property enabled).

For `modal` components, background overlay effect should preferably be controlled via the component's `mask:true` and `maskColor:"rgba(0,0,0,0.5)"` functional properties. Avoid setting `position:fixed`, `top:0`, `left:0`, `background-color` and other styles for overlay effect on Modal component itself, unless highly customized overlay behavior is needed.

#### Col, Row, Grid (Flex Column, Flex Row, Grid Container)

Containers with fixed flex and grid layouts.

- Col: Flex column, display fixed as flex, flex-direction defaults to column but can be set to column-reverse;
- Row: Flex row, display fixed as flex, flex-direction defaults to row but can be set to row-reverse;
- Grid: Grid container, display fixed as grid

#### Table, TableHeader, TableRow, TableCell, TableCellContainer (Table Series Components, Section/Component Only)

For creating HTML tables:

- Table (Basic Table Container): Corresponds to table tag, automatically creates tbody tag for TableRow components added directly under it, no need to add tbody component separately
- TableHeader: Corresponds to thead tag
- TableRow: Corresponds to tr tag, can be added directly under Table or under TableHeader
- TableCell, TableCellContainer: Can only be added under TableRow component. When added under TableRow in TableHeader, corresponds to th tag; when added under TableRow directly under Table, corresponds to td tag.
  - Core Properties
    - rowspan and colspan: Specify cells to span
  - Content Modes:
    - TableCell component can only specify text content via Value property, **cannot add child components**
    - TableCellContainer component **has no Value property** but can add child components to render content

**Mandatory Hierarchy:**

```
<Table>
-<TableHeader-Xx> (optional)
--<TableRow-Xx>
---<TableCell-Xx> value:"Header 1"> or <TableCellContainer-Xx>...
--<TableRow-Xx>
---<TableCell-Xx> value:"Data 1" or <TableCellContainer-Xx>...
```

**Example:**

```
# Frontend Tree

<Table-UserList> border-collapse:"collapse" width:100%
-<TableHeader-Header>
--<TableRow-HeaderRow>
---<TableCell-HId> value:"ID"
---<TableCell-HName> value:"Name"
---<TableCell-HAction> value:"Action"
-<For-UserRows> sourceArray:$userList loopVar:[_user, _index0]
--<TableRow-UserRow>
---<TableCell-CellId> value:_user.id
---<TableCell-CellName> value:_user.name
---<TableCellContainer-CellAction> // Use TableCellContainer to hold buttons
----<Button-Delete> value:"Delete"
```

### Structural Container Components (App Only)

#### Page Component

Application page container, responsible for route mapping and page lifecycle management.

**Properties:**

- `path(STRING)`: Page's route path, logical path identifier without leading slash

**Events:**

- `@init()`: Triggered when page initialization completes, common entry point for application logic

**Usage Example:**

```vl
# Frontend Tree
<Stage-Root>
-<Page-MainPage "mainPage"> path:"main"

# Frontend Event Handlers
<Page-MainPage "mainPage">.@init()
```

**Important Rules:**

- `<Page>` component must be placed directly under `<Stage>` tag
- `<Page>` cannot be nested inside any other container
- `<Page>` cannot contain other `<Page>` components

### Logic Container Components

Logic container components have no UI themselves, cannot be used for layout, **cannot add Style styles (nothing outside angle brackets)**, and since logic containers cannot be accessed in subsequent methods, they **have no id property**.

#### For (Loop Container, Section/Component Only)

Container for dynamically creating repeated components based on data source.

**Properties:**

- `sourceArray(ARRAY)`: Sets data source for loop creation, can be one-dimensional array, two-dimensional array, object array, etc.
- `loopVar([STRING, STRING])`: Defines variable names representing current array element and index in each loop iteration. Format is `[_itemVar, _indexVar]`, e.g., `[_item0, _index0]`. These two variables can be used directly in loop container's child components.

**Syntax:**

```
<For-AnyName> sourceArray:arrayVariable loopVar:[_itemX, _indexX]
-<Child component 1 rendered for each array element>
-<Child component 2 rendered for each array element>
```

**Notes:**

- `For-` prefix + PascalCase name. `sourceArray` and `loopVar` **must** be inside angle brackets.
- `loopVar` naming: see "Variable Naming Rules" section. Format: `[_itemX, _indexX]`.
- **Loop Variable Scope**: Loop variables are only valid in property bindings, conditional expressions, and event handlers of `<For-name>`'s direct children and their descendant components. Referencing outside is an error.

**Example:**

```
<For-UserItems> sourceArray:$userList loopVar:[_item0, _index0]
-<Block-UserItem>
--<Text-UserName> value:("Name: " + _item0.name)
--<If-IsAdult> conditions:(_item0.age >= 18)
---<Icon-AdultIcon> content:"f007"
```

- Use `<StateStyle>` for conditional styling; use `<If-name>` only for conditionally rendering different component tree structures.

#### If (Conditional Container)

Container component that decides whether to render content based on conditional expression.

**Properties:**

- `conditions(BOOL)`: Conditional container's judgment condition expression, elements under this container are only rendered when condition is met (expression returns true)

**Syntax:**

```
<If-AnyName> conditions:(booleanExpression)
-<Child component 1 needing conditional rendering>
-<Child component 2 needing conditional rendering>
```

**Notes:**

- `If-` is a fixed prefix, followed by an arbitrary descriptive name (following component ID naming conventions, PascalCase).
- `conditions` property receives an expression that returns a boolean value. This property **must** be inside angle brackets `<...>`.
- Child components inside `<If-name>` are only rendered when `conditions` expression evaluates to `true`.
- `conditions` expression can reference global variables (`$var`), local variables (`_var`), especially **loop variables** (`_itemX`, `_indexX`) from loops, and system variables (`SYSENV.xxx`).
- **Core Principle Warning**: `<If-name>` **must never** be used to switch different UI layouts based on device type (like PC or mobile). This seriously violates the "one application, one target device" design philosophy. This component's `conditions` property **must** reflect application's **business logic state** (e.g., whether user is logged in, whether data is valid, whether in edit mode, etc.), not device environment.
  - **Wrong usage (strictly forbidden)**: `<If-name> conditions:(SYSENV.deviceType == 'mobile')`
  - **Correct usage (recommended)**: `<If-name> conditions:($formData.isValid && SYSENV.currentUser.isLogin)`
  - **Correct usage (recommended, with comparison operator)**: `<If-name> conditions:($user.points > 100)`

**Example:**

```
<Block-UserStatus>
-<If-IsAdmin> conditions:($currentUser.role == "admin")
--<Text-AdminLabel> value:"Admin"
-<If-IsGuest> conditions:($currentUser.role == "guest")
--<Text-GuestLabel> value:"Guest"
-<If-IsLoggedIn> conditions:(SYSENV.currentUser.isLogin && ($userPermissions.canEdit || SYSENV.currentUser.isAdmin))
--<Button-EditProfile "editButton"> value:"Edit Profile"
```

#### TreeFor (Tree Container, Section/Component Only)

Container component for displaying and handling hierarchically structured data.

**Properties:**

- `sourceArray(ARRAY)`: Sets data source for tree expansion creation, must be an object array with one column for current node ID and another for parent node ID
- `idField(STRING)`: Field name for current node ID in source object array, usually "data ID" if from database
- `pidField(STRING)`: Field name for parent node ID in source object array, this field value cannot be 0; if top-level, this field is empty
- `loopVar([STRING,STRING,STRING,STRING,STRING])`: Defines variable names for current array element, current index, current level, expanded state, and sibling index in each loop iteration. Format is `[_itemVar,_indexVar,_levelVar,_expandedVar,_levelIndexVar]`, e.g., `[_item0,_index0,_level0,_expanded0,_levelIndex0]`. These variables can be used directly in tree container's child components

  - `_itemX`: Current node's data object.
  - `_indexX`: Current node's index in the entire flattened array.
  - `_levelX`: Current node's level depth (top level is 0).
  - `_expandedX`: Boolean indicating whether current node is expanded.
  - `_levelIndexX`: Current node's index among its sibling nodes.

**Methods:**

- `expandAllNodes()`: Expands all expandable nodes in tree container
- `collapseAllNodes()`: Collapses all expanded nodes, keeping only top-level node list
- `expandOneNode(nodeIndex)`: Expands specified node.
- `collapseOneNode(nodeIndex)`: Collapses specified node.

**Syntax:**

```
<TreeFor-AnyName> sourceArray:objectArray idField:"idFieldName" pidField:"parentIdFieldName" loopVar:[_itemX, _indexX, _levelX, _expandedX, _levelIndexX]
-<Child component rendered for each node>
```

### Frontend System Method Components (No Declaration Needed in Component Tree)

Frontend system method classes have only one global instance and can be used without defining in component tree.

#### ClientUtils (Frontend Utility)

Frontend system utility component for common client-side operations (timing, logging, routing) and system-level user refresh.

**Methods**

**Basic Utilities**

* `delay(milliSecond)`: Delays execution for the given milliseconds. Return: `success(BOOL), message(STRING)`
* `consoleLog(title, message)`: Prints debug logs to console. Return: `success(BOOL), message(STRING)`

**User Info Refresh**

* `refreshCurrentUser()`: Refreshes `SYSENV.currentUser`; calls a system API and updates local token if `newToken` is returned. Return: `success(BOOL), user({isLogin(BOOL), userId(STRING), userInfo({})}), newToken(STRING), message(STRING)`

#### SysUI (System UI Component)

Frontend system UI method class. **Do not** use ClientUtils instead of SysUI for modals/toasts.

**Methods:**

- `showModal(title, content)`: Standard styled modal, can get user's confirm or cancel result
  - Return Value:
    - `confirm(BOOL)`: Whether user clicked confirm, returns true/false
    - `cancel(BOOL)`: Whether user clicked cancel, returns true/false
- `showLoading(title)`: Shows loading icon at current page center, no other operations possible while displayed, typically used during async operation waiting
- `hideLoading()`: Hides current page's loading icon, restores page interaction
- `showToast(message, iconType, customizeIcon, duration)`: Shows a timed notification at page center, typically used for feedback after user interactions. Note: `duration` unit is seconds, not milliseconds
- `hideToast()`: Immediately hides the notification at page center, can be used to close toast early

#### SysFile (File System Component)

System component for frontend file upload and download operations.

**Methods:**

- `uploadImage(url)`: Uploads one image to server, can get image info in callback like url, name, type, size, resolution, etc.
  - Return Value: `url(STRING)`, `name(STRING)`, `type(STRING)`, `size(INT)`, `sizeWithUnit(STRING)`, `progress(INT)`, `failureReason(STRING)`, `resolution(STRING)`, `width(INT)`, `height(INT)`
- `uploadImages(quantityLimit, urls)`: Batch upload images to server (max 20), can get image info in callback.
  - Return Value: `data([{}])`, `urlList([STRING])`, `nameList([STRING])`, `typeList([STRING])`, `sizeList([INT])`, `sizeWithUnitList([STRING])`, `progress(INT)`, `failureReason(STRING)`, `resolutionList([STRING])`, `widthList([INT])`, `heightList([INT])`
- `uploadFile(url, accept)`: Uploads one file to server, can get file info in callback.
  - Return Value: `url(STRING)`, `name(STRING)`, `type(STRING)`, `size(INT)`, `sizeWithUnit(STRING)`, `progress(INT)`, `failureReason(STRING)`
- `uploadFiles(quantityLimit, urls)`: Batch upload files to server (max 20), can get file info in callback.
  - Return Value: `data([{}])`, `urlList([STRING])`, `nameList([STRING])`, `typeList([STRING])`, `sizeList([INT])`, `sizeWithUnitList([STRING])`, `progress(INT)`, `failureReason(STRING)`
- `downloadFile(fileName, url)`: Downloads file from specified URL to local
  - Return Value: `success(BOOL)`, `bytesLoaded(INT)`, `progress(INT)`, `failureReason(STRING)`

* `browseImage(outputBase64, compressedWidth, compressedHeight, type, encoderOptions)`: Read local image
  - Description: Reads one local image's info, returns Base64, name, type, size, width/height, temporary local path, file object, etc.
  - Parameters:
    - `outputBase64(Boolean)`: **Output base64** (whether to convert to base64 format after reading, default is yes. Converting to base64 has some performance cost. If only displaying image and uploading, use temporary path + file object method without outputting base64. If choosing to output base64, src field contains base64 result, otherwise no base64 result returned.)
    - `type(STRING)`: **Output format** (Choose jpg or png format for read image. If jpg, can further specify image quality.)
    - `encoderOptions(INT)`: **Output quality** (Output image quality, a value between 0-1. Note: This option only works when output format is jpg; png is a non-compressible format.)
  - Return Value:
    - `base64Code`: **base64 image** (Image converted to base64 format resource URL. Note: Only has result when output base64 is enabled during reading, otherwise empty.)
    - `name`: **Name** (Image name.)
    - `type`: **Type** (Image type.)
    - `size`: **Size** (Image file size.)
    - `width`: **Width** (Image width.)
    - `height`: **Height** (Image height.)
    - `blobUrl`: **Temporary local path** (Image temporary local path.)
    - `failureReason`: **Read failure reason** (Reason for failed image reading.)
    - `file`: **File object** (Read image file object, can be used as file path for uploading.)
* `browseImages(maxNumberPic, outputBase64, compressedWidth, compressedHeight, type, encoderOptions)`: Read multiple local images
  - Description: Reads multiple local images' info, returns an object array where each object contains src, name, type, size, width, height, path, file, etc.
  - Parameters:
    - `maxNumberPic(INT)`: **Max image count** (Maximum number of images allowed per upload.)
    - `type(STRING)`: **Output format** (Choose jpg or png format for read images.)
    - `encoderOptions(INT)`: **Output quality** (Output image quality, value between 0-1.)
  - Return Value:
    - `imageList`: **Image list** (Array of all read images' info. Returns object array, each containing src, name, type, size, width, height, path, file - see single image read return value description for details.)
    - `failureReason`: **Read failure reason** (Reason for failed image reading.)
* `browseFile(outputBase64, accept)`: Read local file
  - Description: Reads one local file's info, returns name, type, size, temporary local path, base64 data, etc. Not supported in WeChat browser, webApp WeChat mini-program, Alipay/DingTalk mini-programs.
  - Parameters:
    - `outputBase64(Boolean)`: **Convert to base64** (Default no. When yes, automatically converts file to base64, allowing base64 string to be read from result, otherwise cannot read.)
    - `accept(STRING)`: **Allowed file types** (Parameter can limit selectable file types, a string constructed from file mimeTypes. For multiple types, separate with comma, e.g., "image/\*,application/x-zip-compressed")
  - Return Value:
    - `name`: **Name** (File name.)
    - `type`: **Type** (File type.)
    - `size`: **Size** (File size.)
    - `blobUrl`: **Temporary local path** (File temporary local path.)
    - `base64Code`: **base64 data** (File's base64 format data. Note: Must choose base64 format during reading to access.)
* `browseFiles(accept, maxNumberFile)`: Read multiple local files
  - Description: Reads multiple local files' info, returns object array where each object contains name, type, size, temporary local path, etc. Not supported in WeChat browser, webApp WeChat mini-program, Alipay/DingTalk mini-programs.
  - Parameters:
    - `accept(STRING)`: **Allowed file types** (Parameter can limit selectable file types, a string constructed from file mimeTypes.)
    - `maxNumberFile(INT)`: **Max file count** (Maximum number of files allowed per upload.)
  - Return Value:
    - `fileList`: **File list** (Array of all read files' info.)
    - `failureReason`: **Read failure reason** (Reason for failed file reading.)

#### SysLocalStorage (Local Storage)

System component for storing data on client side, supports Cookie, SessionStorage, and LocalStorage.

**Methods:**

- `setCookie(path, domain, maxAge, key, value)`: Sets cookie for current domain in browser, requires Key and corresponding value.
- `setCookies(path, domain, maxAge, keyValue)`: Sets multiple cookies for current domain in browser, can pass multiple Key-value pairs.
- `getCookie(key)`: Gets cookie value for specified key under current domain.
- `removeCookie(key)`: Removes cookie for specified key under current domain.

#### SysDevice (Device Access)

System component for frontend access and control of device hardware features.

**Methods:**

- `scanCode()`: Invokes phone camera for scanning, returns scan result
  - Return Value:
    - `data(STRING)`: Information obtained from successful scan.
    - `errMsg(STRING)`: Error message for failed scan.

#### SysRoute （App only）

Frontend system routing component for .vx files to manage navigation, URL parameters, and browser history operations.

**Methods**

**Navigation**

* `navigate(pathPattern, params)`: Navigate to a route with optional dynamic parameters. Parameters: `pathPattern(STRING)` - route path template or full path (e.g., "products/:category/:id"), `params({})` - optional dynamic parameters (e.g., {category:"electronics", id:123})

**Route Information Retrieval**

* `getPathParams()`: Get path parameters from the current route. Returns: `params({})`
* `getQueryParams()`: Get URL query parameters. Returns: `params({})`
* `getHash()`: Get URL hash value. Returns: `hash(STRING)`
* `getCurrentPath()`: Get the current complete path. Returns: `path(STRING)`
* `getCurrentOrigin()`: Get the current domain. Returns: `origin(STRING)`
* `getCurrentFullUrl()`: Get the current complete URL. Returns: `url(STRING)`

**Browser History**

* `goBack()`: Navigate back in browser history
* `goForward()`: Navigate forward in browser history
* `reload()`: Refresh the current page

### Widgets

Widgets are additional functional components added under entity UI components (basic UI, layout containers, etc.) that can provide form field handling, dynamic styling, animation, drag, scroll, and other behaviors for target entity UI components.

#### StateStyle (State and Conditional Style Component)

`<StateStyle>` is used to define styles applied to its parent component during specific interaction states (like mouse hover) or when specific logic conditions are met. It makes dynamic style management more centralized and clear.

**Syntax:**

```
<Parent Component ...>
-<StateStyle-StateName> trigger:"stateString" conditions:booleanExpression style1:value ..
-<StateStyle-StateName> conditions:(booleanExpression) style1:value ..
```

**Notes:**

- `<StateStyle>` must be a direct child component of the UI component it affects (one level deeper indentation).
- **StateStyle component names should reflect their purpose**, e.g., `<StateStyle-HoverEffect>`.
- A parent component can have multiple `<StateStyle>` child components for handling different states and conditions.
- `<StateStyle>` style properties **do not allow property expressions**, only literal values or CSS native calc expressions.
- `trigger` and `conditions` properties are functional properties.
  - **`trigger` property**: Receives a specific string for responding to UI's built-in interaction states, corresponding to CSS pseudo-classes and some pseudo-elements. Common values include "hover", "active", "focus", "disabled", etc.;
  - **`conditions` property**: Receives an expression returning a boolean value. When expression is `true`, styles are applied. This allows style changes based on arbitrary application state (like `$isInvalid`, `$nightTheme == 'dark'`).

**Example:**

```
<ButtonContainer-Submit> disabled:(!$canSave)
-<Text-SubmitLabel> value:"Submit"
-<StateStyle-HoverEffect> trigger:"hover" background-color:"#2980b9" // Darker on hover
-<StateStyle-DisabledState> trigger:"disabled" background-color:"#bdc3c7" cursor:"not-allowed" // Disabled state style
-<StateStyle-ErrorBorder> conditions:$formHasError border-width:"2px" border-style:"solid" border-color:"#e74c3c" // Error state style
```

#### Animation (Animation Effect)

Added as a "widget" to target UI component to add animation effects. After adding, VL system automatically wraps the target UI element with a transparent Div to implement animation effects.

**Properties**

- **animationName (Animation Type)**

  - **Description:** Selects animation type from system default animation library, divided into three categories: emphasis, entrance, and exit animations. Each animation type has multiple effects, each possibly with multiple directions.
  - **Options:**

    - Emphasis: bounce, flip, flash, jello, pulse, rubberBand, shake, swing, tada, wobble, hinge, rotateC, rotateAC;
    - Entrance: fadeIn, fadeInDown, fadeInUp, fadeInLeft, fadeInRight, bounceIn, bounceInDown, bounceInUp, bounceInLeft, bounceInRight, rotateIn, rotateInDownLeft, rotateInUpLeft, rotateInDownRight, rotateInUpRight, slideInDown, slideInUp, slideInLeft, slideInRight, zoomIn, zoomInDown, zoomInUp, zoomInLeft, zoomInRight, flipInX, flipInY, rollIn;
    - Exit: fadeOut, fadeOutDown, fadeOutUp, fadeOutLeft, fadeOutRight, bounceOut, bounceOutDown, bounceOutUp, bounceOutLeft, bounceOutRight, rotateOut, rotateOutDownLeft, rotateOutUpLeft, rotateOutDownRight, rotateOutUpRight, slideOutDown, slideOutUp, slideOutLeft, slideOutRight, zoomOut, zoomOutDown, zoomOutUp, zoomOutLeft, zoomOutRight, flipOutX, flipOutY, rollOut;
- **duration (Animation Duration in Seconds)**

  - **Description:** Animation effect duration in seconds.
- **delay (Start Delay in Seconds)**

  - **Description:** Animation start delay in seconds.
- **iterationCount (Play Count)**

  - **Description:** Number of times to play each trigger, default is 1 (play once then stop).
- **loop (Loop Playback)**

  - **Description:** Toggle to control animation looping, disabled by default.
- **playAnimate (Preview Animation)**

  - **Description:** Click button to preview current animation effect.
- **trigger (Trigger Timing)**

  - **Description:** Method to trigger current animation.
  - **Options:**
    - **onRender (Auto Play):** On enter.
    - **onHide (On Object Hide):** On leave.
    - **onClick (Click):** On click.
    - **onHover (Mouse Enter):** On mouse enter.
    - **custom (Manual Call):** Manual call.
- **initialVisibility (Hide Before Start)**

  - **Description:** Whether to hide component with this animation before trigger.
- **editAnimate (Edit Animation)**

  - **Description:** Click button to open animation editor for current animation.
- **hideAfterCompletion (Hide After Completion)**

  - **Description:** Whether to hide component after animation ends. Useful for exit-style animations.

**Methods**

- **play (Replay)**
  - **Description:** Plays current animation group from beginning. Note: Animation group is a whole; each play starts from beginning, unlike timeline animations that continue from pause point.
- **stop (Stop Playback)**
  - **Description:** Stops current animation group playback.

#### AnimationGroup (Animation Group)

`data-animate-group` component manages triggering and playback of a group of animations. It's a container that can only contain animation components.

**Properties**

- **trigger (Trigger Timing)**
  - **Description:** Selects when animation group triggers, defaults to auto-play. Can also select click, mouse enter, etc., equivalent to adding an auto event. Can also select "manual call" which requires control via event panel.
  - **Options:**
    - **onRender (Auto Play):** Triggers on object enter/load.
    - **onHide (On Object Hide):** Triggers when object is set invisible via action.
    - **onClick (Click):** Triggers on object click.
    - **onHover (Mouse Enter):** Triggers on mouse enter object.
    - **custom (Manual Call):** Manually triggered via other event actions.
- **initialVisibility (Hide Before Start)**
  - **Description:** Whether to hide object before animation group starts.
- **hideAfterCompletion (Hide After Completion)**
  - **Description:** Whether to hide object after animation group ends.

**Methods**

- **play (Replay)**
  - **Description:** Plays current animation group from beginning. Note: Animation group is a whole; each play starts from beginning, unlike timeline animations that continue from pause point.
- **stop (Stop Playback)**
  - **Description:** Stops current animation group playback.

#### UseDraggable (Drag Source Widget, Section/Component Only)

useDraggable gives any parent UI component it's attached to the ability to be dragged as a drag source. It manages data setting at drag start and state cleanup at drag end. Drag operations are complex user interactions and can only be added in Section/Component.

**Core Events**

- **@dragStart**: Triggered when user starts dragging the element with this widget attached. This is the only time `setData()` can be called on `dataTransfer`. Widget also sets `event.dataTransfer.effectAllowed` to declare allowed drag operation types, affecting mouse cursor style during drag.
- **@dragEnd**: Triggered when drag operation ends, whether drop succeeded, was cancelled, or dropped on invalid area. Event emits `event.dataTransfer.dropEffect` parameter to determine final result of drag-drop operation.

#### UseDropTarget (Drop Target Widget, Section/Component Only)

useDropTarget gives any parent UI component it's attached to the ability to serve as a drop target (receive drag-drop operations). Used to manage drop zone highlighting and data extraction from drop events.

**Core Events**

- **@dragEnter**: Triggered when dragged element first enters the area of component with this widget attached. Widget **automatically calls `event.preventDefault()`**. Also emits `event.dataTransfer.types` to check if drag data type is acceptable.
- **@dragOver**: Continuously triggered when dragged element moves within the area of component with this widget attached. **Must call `event.preventDefault()`** to allow `drop` event to trigger. Also writes `event.dataTransfer.dropEffect` to set area's preferred operation type, affecting mouse cursor style.
- **@dragLeave**: Triggered when dragged element leaves the area of component with this widget attached.
- **@drop**: Triggered when user releases mouse button over the area of component with this widget attached. Widget internally calls `event.preventDefault()` and reads `event.dataTransfer.getData()` to get data passed from drag source.

**Key Rules:**

1. Drag events (`@dragStart`, `@dragEnd`, `@dragOver`, `@drop`) must be registered on drag widgets (`<UseDraggable>`, `<UseDropTarget>`), not regular components
2. `@dragOver` must call `event.preventDefault()` for `@drop` to fire

### Module Components

#### Section (App Only)

Section defined in current project used in App. When added to component tree, it acts as a component (e.g., `<Section-MySection "mySection"> property1:value... `).

Note: Section components behave similarly to extended UI components, **strictly forbidden to add child components other than widgets**. For example, the following usage is strictly forbidden:

**Wrong Usage**:

```
<Section-ChatRoomLayout "layoutView">
-<Text-RoomTitle> value:$title //Cannot add Text and other basic UI components under Section; Section is not a container
-<Section-OnlineUsersPanel "onlinePanel"> // Forbidden to add other Sections under Section
```

Please note:

- Section's properties/methods/events must strictly follow Section's file definition, **strictly forbidden to invent Section properties/methods/events**

#### Component (App or Section)

Custom additional components defined in current project can be used in App or Section, introduced using `<Component-ComponentName>`. Note: Component is an independent component and cannot have non-widget child components added under it.


## 2. Frontend Component Common Properties/Methods/Events

### Common Properties

#### Non-Read-Only Properties

**The following common properties apply to all non-structural container frontend UI components (basic UI components, layout containers):**

- **show(BOOL)**:

  - Default: true
  - Description: When set to false, component is not rendered on page (equivalent to display:none). Usually doesn't need declaration unless initial state is false.

#### Read-Only Properties

##### Size Properties (excluding `transform`)

- **`offsetWidth` / `offsetHeight`**: Element's full size (content + padding + border + scrollbar). When element has no scale or rotate, prefer this over `getBoundingClientRect()` method
- **`clientWidth` / `clientHeight`**: Element's internal visible size (content + padding). When element has no scale or rotate, prefer this over `getBoundingClientRect()` method
- **`scrollWidth` / `scrollHeight`**: Element's full content size (content + padding).

##### Relative Position Properties

- **`offsetLeft` / `offsetTop`**: Element position relative to **nearest positioned ancestor**.

### Common Events

!!Note: Not all native JS events can be listened to on all components. Common events only include those listed in this document.

**The following common events apply to all UI components (frontend root components, basic UI components, layout containers, structural containers):**

- `@init()`: Triggered when component initialization completes
- `@click(event)`: Click event
- `@mouseOn(event)`: Mouse enter event
- `@mouseOut(event)`: Mouse leave event
- `@mouseDown(event)`: Mouse down event
- `@mouseUp(event)`: Mouse up event

**The following common events apply to layout containers, structural containers:**

- `@scrollToBottom()`: Triggered when container scrolls to bottom (or rightmost for horizontal layout)
- `@scrollToTop()`: Triggered when container scrolls to top (or leftmost for horizontal layout)
- `@clickOutside()`: Triggered when clicking outside container area

### Common Methods

**The following methods apply to all UI components (basic UI components, layout containers, structural containers)**:

- `focus()`, `blur()`: Gain/lose focus. When adding these methods to a component, system automatically sets its tabindex property to -1, no manual specification needed;
- `getBoundingClientRect()`: Returns an object containing element's real-time position and full size relative to **viewport**. Note: When clientWidth/Height or offsetWidth/Height can be used, prefer those to reduce overhead and simplify code.

**The following common methods apply to all layout containers, structural containers:**

- `scrollToBottom()`: Scroll to bottom. When direction is column, scrolls to bottom; when row, scrolls to rightmost, and so on;
- `scrollToTop()`: Scroll to top
- `scrollTo(left,top,speed)`: Scroll to position, left and top are distances from left and top, speed is value from 1-100 where 1 is fastest, 100 slowest

## 3. Components Used in ServiceDomain

All backend components must first be created under ServiceDomainRoot component before use. (Define before use principle)

### Backend Data Components

#### VirtualTable (Virtual Table)

Component for accessing and operating database tables in backend services.

**Methods**

| Method              | Parameters                                    | Return Value                           | Description                             |
| ------------------- | --------------------------------------------- | -------------------------------------- | --------------------------------------- |
| `select`          | conditions, orderBy, outputRows, outputFields | success, message, dataArray, structure | Query data                              |
| `insert`          | valueObj({})                                  | success, message, dataId, dataObj      | Insert data (system fields auto-filled) |
| `update`          | conditions, set, limit                        | success, message, affect               | Update data                             |
| `batchUpdateById` | source([{}])                                  | success, message, affect               | Batch update by ID                      |
| `count`           | conditions                                    | success, message, count                | Count records                           |
| `delete`          | conditions, limit                             | success, message, affect               | Delete data (soft delete recommended)   |

##### **Conditions Array (conditions)**

- **Format**: `[[field, operator, value], ...]`
- **Operators**: `eq`(=), `neq`(!=), `gt`(>), `gte`(>=), `lt`(<), `lte`(<=), `in`, `nin`, `contains`(%val%), `startsWith`(val%), `endsWith`(%val), `isNull`, `isNotNull`
- **OR Conditions**: `["OR", [condition1], [condition2], ...]`

**`isNull` / `isNotNull` Operators:**

One-way operators (no `value` field):
- `["field","isNull"]` — matches records where field IS NULL
- `["field","isNotNull"]` — matches records where field IS NOT NULL
- `*isNull` / `*isNotNull` are **not supported**; whether to push the condition is controlled by caller logic

**Dynamic Filtering with `*` Prefix Operators:**

When you need to conditionally ignore a filter based on whether a value is provided, use `*` prefix operators (like `*eq`, `*contains`). This is especially useful for optional search parameters.

`*op` operators automatically **skip the condition** when any of the following is true:
1. `value == null`
2. `value` is a STRING and `value.trim() == ""` (empty or whitespace-only)
3. Operator is `*in` or `*nin` and `value` is an empty array `[]`

When none of the above apply, the filter executes normally.

**Explicit null / empty value queries (non-`*` operators):**
- Query empty string: `["field","eq",""]`
- Query NULL: `["field","isNull"]`

**Examples**:

```vl
# Optional keyword — skipped when null, empty string, or whitespace-only
[["name","*contains",null]]        # Ignored
[["name","*contains",""]]          # Ignored (VL 2.10 behavior)
[["name","*contains","   "]]       # Ignored (VL 2.10 behavior)
[["name","*contains","prod"]]      # Applied

# Optional set filter — skipped when empty array
[["status","*in",[]]]              # Ignored (VL 2.10 behavior)
[["status","*in",["running"]]]     # Applied

# Explicit null / empty queries (non-* operators)
[["name","eq",""]]                 # Matches records with empty string
[["name","isNull"]]                # Matches records where name IS NULL
```

**Migration Note (breaking change):** Any logic that previously relied on `*eq ""` or `*contains ""` producing a valid filter will no longer work. Migrate to explicit `eq ""` if querying for empty string is intentional.

**Best Practice**: Use `*` prefix operators for optional search parameters. VL 2.10 auto-ignores null, empty/whitespace strings, and empty arrays (`*in`/`*nin`). Use non-`*` operators (`eq`, `isNull`) for explicit empty/null queries.

##### **Order Array (orderBy)**

- **Format**: `[[field, "asc"/"desc"], ...]`
- **No Sorting**: `null`

##### **Pagination Array (outputRows)**

- **Format**: `[offset, limit]`
- **No Pagination**: `null`

##### **Update Operation Array (set)**

- **Format**: `[[field, operationType, value], ...]`
- **Operation Types**: `"set"`(set value), `"inc"`(increment/decrement), `"mul"`(multiply), `"append"`(append to array)

##### System Fields

**System Fields**: `_id`, `_user`, `_create`, `_update` are auto-managed by system and cannot be specified during insert/update

**`_user` and unauthenticated requests**: When a write operation is performed by an unauthenticated user, `_user` is automatically set to `null`. No placeholder value (such as `"anonymous"`) is filled in. Tracking anonymous visitors is a business-layer concern. If needed, define a dedicated field on the business table (e.g., `guestToken(STRING)`) and write to it explicitly in the SERVICE logic. The platform identity system only covers users authenticated through TokenIssuer.

##### **Quick Examples**

```vl
# Query - with conditions, sorting, pagination
<VirtualTable-Users "userTable">.select([["status","eq","active"], ["age","gte",18]], [["_create","desc"]], [0, 20], ["id","name","email"]) -> _result

# Insert - system fields auto-filled
<VirtualTable-Users "userTable">.insert({name:"John Doe", email:"JohnDoe@gmail.com"}) -> _result
# _id, _user, _create, _update are auto-filled by system

# Update - single record
<VirtualTable-Users "userTable">.update([["id","eq",123]], [["name","set","New Name"]], 1) -> _result

# Batch update
<VirtualTable-Products "productTable">.batchUpdateById([{"_id":101, "price":299}, {"_id":102, "price":199}]) -> _result

# Count
<VirtualTable-Orders "orderTable">.count([["status","eq","pending"]]) -> _result
```

##### **Advanced Examples**

```vl
# OR condition + fuzzy search
<VirtualTable-Posts "postTable">.select([["OR", ["title","contains","VL"], ["content","contains","VL"]], ["status","eq","published"]], null, [0,10]) -> _result

# ✅ Dynamic filtering (recommended) - use * prefix to auto-ignore null / empty / whitespace
<VirtualTable-Users "userTable">.select([["name","*contains",$keyword], ["role","*eq",$role]], null, [0,20]) -> _result
# Automatically ignores when $keyword/$role is null, empty string, or whitespace-only

# ❌ Dangerous approach - manual condition concatenation (similar to SQL injection risk)
-_conditions([]) = [["role","eq","admin"]]
-IF $keyword != null
--_conditions.push(["name","contains",$keyword])
-<VirtualTable-Users "userTable">.select(_conditions, null, [0,20]) -> _result
```

#### ServerCache (Cache Table)

Cache table for cached data read/write. Unlike VirtualTable, cache table doesn't need to bind to an entity table; system automatically creates and maintains corresponding cache data storage.

**Methods**

**Single Value Cache Operations**

- `set(key, value, expire)`: Sets single value cache. Updates if record exists, creates if not. Return: `success(BOOL)`, `message(STRING)`
- `get(key)`: Gets single value type cache record. Return: `value(STRING | NUMBER)`, `success(BOOL)`, `message(STRING)`
- `getMultiple(keys)`: Gets multiple cache records. Return: `values([STRING | NUMBER])`, `success(BOOL)`, `message(STRING)`
- `insertIfNotExists(key, value, expire)`: Inserts single value cache. Fails if key already exists. Return: `success(BOOL)`, `message(STRING)`
- `updateIfExists(key, value, expire)`: Updates single value cache. Fails if key doesn't exist. Return: `success(BOOL)`, `message(STRING)`
- `incrBy(key, value)`: Increments numeric cache record value (can be negative, can include decimals). Return: `value(NUMBER)`, `success(BOOL)`, `message(STRING)`

**Expiration Time Management**

- `setExpire(key, expire)`: Sets cache record expiration duration (applies to single value or set types). Return: `success(BOOL)`, `message(STRING)`
- `getTimeToLive(key)`: Gets cache record's remaining time to live. Returns -1 if no expiration set. Return: `ttl(INT)`, `success(BOOL)`, `message(STRING)`

**Delete Operations**

- `delete(key)`: Deletes cache record (applies to single value or set types). Return: `success(BOOL)`, `message(STRING)`

**Set Cache Operations**

- `addToSet(key, values)`: Creates set type record or adds elements to existing set. All elements are auto-converted to string type after adding. Return: `addedNumber(INT)`, `success(BOOL)`, `message(STRING)`
- `removeFromSet(key, values)`: Removes one or more elements from set. Return: `removedNumber(INT)`, `success(BOOL)`, `message(STRING)`
- `getSetMembers(key)`: Gets all elements in set type record. Return: `members(ARRAY)`, `success(BOOL)`, `message(STRING)`
- `isSetMember(key, value)`: Checks if an element is in the set. Return: `isMember(BOOL)`, `success(BOOL)`, `message(STRING)`

**Cache Management**

- `scanKeys(cursor, limit)`: Gets list of all record key names in cache database, supports pagination. Return: `keys(ARRAY)`, `cursor(STRING)`, `success(BOOL)`, `message(STRING)`

### Backend Functional Components

#### TokenIssuer (Server-side Authentication & Session Management)

System authentication component for token issuance, session tracking, and user identity refresh. Supports multi-device sessions, concurrent login control, and instant invalidation via versioning.

**Methods**

**Token Issuance**

* `generateLoginToken(userId, authRealmCode, subjectInfo, userInfo, maxConcurrent)`:Generates and issues a new login token. If the maximum concurrent session limit is exceeded, the oldest session is revoked. **Return**: `success(BOOL), token(STRING), tokenId(STRING), expiresAt(TIMESTAMP), message(STRING)`
* **userId**: Unique user identifier.
* **authRealmCode**: Auth realm for the login session. If omitted, the tenant default realm (`Default`) is used. Tokens are only valid within this realm.
* **subjectInfo**: Auth-relevant user attributes at the auth-realm level (e.g. department, attributes). Written to runtime cache; does not include project roles.
* **userInfo**: Non-sensitive user display data (e.g. name, avatar). Embedded in the JWT only, not used for authorization.
* **maxConcurrent**: Maximum allowed concurrent sessions for the user; oldest sessions are removed when exceeded.

**Token Revocation**

* `revokeToken(tokenId)`: Revokes a single token immediately. Return: `success(BOOL), message(STRING)`
* `revokeUserTokens(userId, authRealmCode)`: Revokes all tokens of a user within the given scope (user-level versioning). Return: `success(BOOL), affectedCount(INT)`
* `revokeAllTokens(authRealmCode)`: auRealm-level global revoke (emergency). Return: `success(BOOL)`

**User & Token Refresh**

* `refreshUserInfo(userId, authRealmCode, newUserInfo)`: Refreshes userInfo for all active tokens of the user. Return: `success(BOOL), message(STRING)`

**Session Query**

* `getUserSessions(userId, authRealmCode)`: Gets all active sessions (device list). Return: `success(BOOL), sessions([{}])`
* `getCurrentSession(authRealmCode)`: Gets current session detail (includes deviceInfo). Return: `success(BOOL), session({userInfo({}), deviceInfo({}), tokenId(STRING), expiresAt(TIMESTAMP)})`

**Notes**

* `subjectInfo` is for middleware authorization only (Redis), not exposed to frontend
* `userInfo` is embedded in JWT for frontend display
* Token validity is enforced via user-level and global version comparison

#### ServerApi (Backend API Request Client)

Properties and methods are identical to Frontend API Request Client component.

#### MQ (Message Queue)

Receives messages sent by services/methods for asynchronous processing. Used for basic async processing and request peak shaving.

**Properties**

- struct({}): Message structure, a single-layer object, e.g., `<MQ-DataStream "dataStream"> struct:{structField1:STRING,structField2:INT}`

**Events**

- @Message(structField1, structField2...): Message received event, message processing logic can be defined in event body

**Methods**

- send(structField1, structField2...): Sends message to message queue. Note: Message structure must strictly follow message queue component's struct property. E.g., `-<MQ-DataStream "dataStream">.send(_data,_num)`

#### Encryption (Cryptographic Operations)

Cryptographic component for hash generation, RSA signing, verification, encryption, and decryption operations, as well as symmetric encryption/decryption.

**Methods**

**Hash Operations**

- `genHashCode(text)`: Generates hash code from text. **Return**: `hashCode(STRING)`
- `verifyHashCode(text, hash)`: Verifies text against hash code. **Return**: `success(BOOL)`

**RSA Signature Operations**

- `signWithRSA(data, type, privateKey)`: Signs data with RSA private key. **Return**: `sign(STRING)`
  - **type**: Signature algorithm type. Options: `RSA`, `RSA2`
- `verifySignWithRSA(sign, data, type, publicKey)`: Verifies RSA signature with public key. **Return**: `success(BOOL), message(STRING)`
  - **type**: Signature algorithm type. Options: `RSA`, `RSA2`

**RSA Encryption/Decryption Operations**

- `asymmetricEncryption(plaintext, ciphertextEncoding, plaintextEncoding, publicKey)`: Encrypts plaintext with RSA public key. **Return**: `data(STRING)`
  - **ciphertextEncoding**: Encoding format for the encrypted output. Options: `base64`, `hex`. Default: `base64`
  - **plaintextEncoding**: Encoding format of the input plaintext. Options: `base64`, `hex`, `raw`. Default: `raw`
- `asymmetricDecryption(ciphertext, plaintextEncoding, ciphertextEncoding, privateKey)`: Decrypts ciphertext with RSA private key. **Return**: `data(STRING)`
  - **plaintextEncoding**: Encoding format for the decrypted output. Options: `base64`, `hex`, `raw`. Default: `raw`
  - **ciphertextEncoding**: Encoding format of the input ciphertext. Options: `base64`, `hex`. Default: `base64`

**Symmetric Encryption/Decryption Operations**

- `symmetricEncryption(plaintext, ciphertextEncoding, plaintextEncoding, key, keyEncoding, iv, ivEncoding)`: Encrypts plaintext with symmetric encryption. **Return**: `data(STRING), iv(STRING), key(STRING)`
  - **plaintextEncoding**: Encoding format of the input plaintext. Options: `base64`, `hex`, `raw`. Default: `raw`
  - **ciphertextEncoding**: Encoding format for the encrypted output. Options: `base64`, `hex`. Default: `base64`
  - **keyEncoding**: Encoding format of the encryption key. Options: `base64`, `hex`, `raw`. Default: `raw`
  - **ivEncoding**: Encoding format of the initialization vector. Options: `base64`, `hex`, `raw`. Default: `raw`
- `symmetricDecryption(ciphertext, plaintextEncoding, ciphertextEncoding, key, keyEncoding, iv, ivEncoding)`: Decrypts ciphertext with symmetric decryption. **Return**: `data(STRING), iv(STRING), key(STRING)`
  - **plaintextEncoding**: Encoding format for the decrypted output. Options: `base64`, `hex`, `raw`. Default: `raw`
  - **ciphertextEncoding**: Encoding format of the input ciphertext. Options: `base64`, `hex`. Default: `base64`
  - **keyEncoding**: Encoding format of the decryption key. Options: `base64`, `hex`, `raw`. Default: `raw`
  - **ivEncoding**: Encoding format of the initialization vector. Options: `base64`, `hex`, `raw`. Default: `raw`

#### Email (Email Service)

Email service component for sending single or multiple emails with optional attachments.

**Methods**

- `sendEmail(receiver, title, body, sendFormat, attachments)`: Sends a single email. **Return**: `success(BOOL), message(STRING)`
  - **receiver**: Email recipient address.
  - **title**: Email subject line.
  - **body**: Email content.
  - **sendFormat**: Email format. Options: `text`, `html`. Default: `text`
  - **attachments**: List of attachments. Format: `[{key, value}]`
- `sendEmails(receivers, title, body, sendFormat, attachments)`: Sends multiple emails. **Return**: `success(BOOL), message(STRING)`
  - **receivers**: Array of email recipient addresses.
  - **title**: Email subject line.
  - **body**: Email content.
  - **sendFormat**: Email format. Options: `text`, `html`. Default: `text`
  - **attachments**: List of attachments. Format: `[{key, value}]`

### Backend System Method Components (No Declaration Needed in Component Tree)

Backend system method classes have only one global instance and can be used without defining in component tree.

#### ServerUtils (Backend Utility Class)

System method class callable in backend services. Not allowed to call from frontend.

**Methods:**

- `getCurrentTime()`: Gets server's current time. Returns server system time, useful for time synchronization or getting standard time.
- `delay(second)`: Executes wait operation on server side, pausing for specified seconds.
