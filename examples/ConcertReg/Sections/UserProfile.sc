// VL_VERSION:2.91

# Frontend Variables
$userId(STRING) = "user001"
$userInfo(JSON) = {}
$loading(BOOL) = true

# Frontend Tree
<Column "root"> style:root
--<Column "profileHeader"> style:profileHeader
----<Box "avatarWrap"> style:avatarWrap
------<Text "avatarEmoji"> text:🎵 style:avatarEmoji
----<Text "nickname"> text:$userInfo.nickname style:nickname
----<Text "role"> text:$userInfo.role == "admin" ? "管理员" : "音乐爱好者" style:roleText
--<ScrollView "scroll"> style:scroll
----<Column "menuList"> style:menuList
------<Touchable "menuRegistrations"> @tap:onGoRegistrations style:menuItem
--------<Row "menuRow1"> style:menuRow
----------<Text "menuIcon1"> text:🎫 style:menuIcon
----------<Text "menuText1"> text:我的报名记录 style:menuText
----------<Text "menuArrow1"> text:→ style:menuArrow
------<Touchable "menuFavorites"> @tap:onGoFavorites style:menuItem
--------<Row "menuRow2"> style:menuRow
----------<Text "menuIcon2"> text:❤️ style:menuIcon
----------<Text "menuText2"> text:收藏的音乐会 style:menuText
----------<Text "menuArrow2"> text:→ style:menuArrow
------<Box "menuDivider"> style:menuDivider
------<Touchable "menuAbout"> @tap:onAbout style:menuItem
--------<Row "menuRow3"> style:menuRow
----------<Text "menuIcon3"> text:ℹ️ style:menuIcon
----------<Text "menuText3"> text:关于我们 style:menuText
----------<Text "menuArrow3"> text:→ style:menuArrow
------<Touchable "menuVersion"> style:menuItem
--------<Row "menuRow4"> style:menuRow
----------<Text "menuIcon4"> text:📱 style:menuIcon
----------<Text "menuText4"> text:版本号 style:menuText
----------<Text "versionValue"> text:v1.0.0 style:versionText

# Frontend Event Handlers
HANDLER onLoad()
--SET $loading = true
--CALL UserDomain.getUserProfile(id:$userId)
----ON SUCCESS
------SET $userInfo = result.user
------SET $loading = false
----ON ERROR
------SET $loading = false
------TOAST "加载用户信息失败"

HANDLER onGoRegistrations()
--NAVIGATE MyRegistrations

HANDLER onGoFavorites()
--NAVIGATE FavoriteList

HANDLER onAbout()
--TOAST "露天音乐会 - 让音乐与星空相遇"

# Frontend Styles
STYLE root
--flex: 1
--backgroundColor: #f8fafc

STYLE profileHeader
--paddingTop: 60px
--paddingBottom: 28px
--alignItems: center
--backgroundColor: #6366f1
--borderBottomLeftRadius: 28px
--borderBottomRightRadius: 28px
--gap: 10px

STYLE avatarWrap
--width: 80px
--height: 80px
--borderRadius: 40px
--backgroundColor: rgba(255,255,255,0.2)
--alignItems: center
--justifyContent: center

STYLE avatarEmoji
--fontSize: 36px

STYLE nickname
--fontSize: 20px
--fontWeight: 700
--color: #ffffff

STYLE roleText
--fontSize: 13px
--color: rgba(255,255,255,0.8)
--fontWeight: 500

STYLE scroll
--flex: 1

STYLE menuList
--padding: 16px
--gap: 2px
--paddingBottom: 100px

STYLE menuItem
--backgroundColor: #ffffff
--paddingHorizontal: 18px
--paddingVertical: 16px

STYLE menuRow
--flexDirection: row
--alignItems: center
--gap: 14px

STYLE menuIcon
--fontSize: 20px

STYLE menuText
--flex: 1
--fontSize: 15px
--fontWeight: 500
--color: #0f172a

STYLE menuArrow
--fontSize: 14px
--color: #cbd5e1

STYLE menuDivider
--height: 8px
--backgroundColor: #f8fafc

STYLE versionText
--fontSize: 14px
--color: #94a3b8
--fontWeight: 500
