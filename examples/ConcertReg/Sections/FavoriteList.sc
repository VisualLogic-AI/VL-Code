// VL_VERSION:2.91

# Frontend Variables
$favoriteList(JSON) = []
$page(INT) = 1
$pageSize(INT) = 20
$total(INT) = 0
$loading(BOOL) = true

# Frontend Tree
<Column "root"> style:root
--<Column "header"> style:header
----<Row "headerRow"> style:headerRow
------<Touchable "backBtn"> @tap:onBack style:backBtn
--------<Text "backIcon"> text:← style:backIcon
------<Text "pageTitle"> text:❤️ 我的收藏 style:pageTitle
--<ScrollView "scroll"> style:scroll onEndReached:onLoadMore
----<Column "listWrap"> style:listWrap
------IF $loading == true
------<Column "loadingWrap"> style:loadingWrap
--------<Text "loadingText"> text:加载中... style:loadingText
------IF $favoriteList.length == 0 AND $loading == false
------<Column "emptyState"> style:emptyState
--------<Text "emptyIcon"> text:🤍 style:emptyIcon
--------<Text "emptyTitle"> text:还没有收藏 style:emptyTitle
--------<Text "emptyDesc"> text:去发现喜欢的音乐会吧 style:emptyDesc
--------<Touchable "browseBtn"> @tap:onBrowse style:browseBtn
----------<Text "browseText"> text:去看看 style:browseBtnText
------FOR $item IN $favoriteList
------<Touchable "favCard"> @tap:onConcertTap($item.id, $item.title) style:favCard
--------<Row "favRow"> style:favRow
----------<Image "favCover"> src:$item.coverImage style:favCover resizeMode:cover
----------<Column "favInfo"> style:favInfo
------------<Text "favTitle"> text:$item.title style:favTitle numberOfLines:2
------------<Row "favDateRow"> style:favMetaRow
--------------<Text "favDateIcon"> text:📅 style:favMetaIcon
--------------<Text "favDate"> text:$item.startTime style:favMetaText
------------<Row "favVenueRow"> style:favMetaRow
--------------<Text "favVenueIcon"> text:📍 style:favMetaIcon
--------------<Text "favVenue"> text:$item.venue style:favMetaText numberOfLines:1
------------<Text "favPrice"> text:"¥" + $item.minPrice + " 起" style:favPrice
----------<Touchable "unfavBtn"> @tap:onUnfavorite($item.id) style:unfavBtn
------------<Text "unfavIcon"> text:❤️ style:unfavIconText
------IF $favoriteList.length > 0 AND $page * $pageSize >= $total
------<Text "noMore"> text:— 全部收藏都在这了 — style:noMoreText

# Frontend Event Handlers
HANDLER onLoad()
--SET $loading = true
--CALL ConcertDomain.getFavorites(userId:"user001", page:$page, pageSize:$pageSize)
----ON SUCCESS
------SET $favoriteList = result.list
------SET $total = result.total
------SET $loading = false
----ON ERROR
------SET $loading = false
------TOAST "加载收藏列表失败"

HANDLER onBack()
--NAVIGATE BACK

HANDLER onConcertTap(concertId, concertTitle)
--NAVIGATE ConcertDetail WITH concertId:concertId, concertTitle:concertTitle

HANDLER onUnfavorite(concertId)
--CALL ConcertDomain.toggleFavorite(userId:"user001", concertId:concertId)
----ON SUCCESS
------SET $favoriteList = $favoriteList.filter(c => c.id != concertId)
------SET $total = $total - 1
------TOAST "已取消收藏"
----ON ERROR
------TOAST "操作失败"

HANDLER onLoadMore()
--IF $page * $pageSize >= $total
----RETURN
--SET $page = $page + 1
--CALL ConcertDomain.getFavorites(userId:"user001", page:$page, pageSize:$pageSize)
----ON SUCCESS
------SET $favoriteList = $favoriteList.concat(result.list)
------SET $total = result.total
----ON ERROR
------SET $page = $page - 1
------TOAST "加载更多失败"

HANDLER onBrowse()
--NAVIGATE ConcertList

# Frontend Styles
STYLE root
--flex: 1
--backgroundColor: #f8fafc

STYLE header
--paddingTop: 48px
--paddingBottom: 16px
--paddingHorizontal: 20px
--backgroundColor: #6366f1
--borderBottomLeftRadius: 24px
--borderBottomRightRadius: 24px

STYLE headerRow
--flexDirection: row
--alignItems: center
--gap: 12px

STYLE backBtn
--width: 36px
--height: 36px
--borderRadius: 18px
--backgroundColor: rgba(255,255,255,0.2)
--alignItems: center
--justifyContent: center

STYLE backIcon
--color: #ffffff
--fontSize: 18px
--fontWeight: 700

STYLE pageTitle
--fontSize: 20px
--fontWeight: 700
--color: #ffffff

STYLE scroll
--flex: 1

STYLE listWrap
--padding: 16px
--gap: 12px
--paddingBottom: 100px

STYLE loadingWrap
--padding: 40px
--alignItems: center

STYLE loadingText
--fontSize: 14px
--color: #94a3b8

STYLE emptyState
--alignItems: center
--paddingVertical: 60px
--gap: 12px

STYLE emptyIcon
--fontSize: 56px

STYLE emptyTitle
--fontSize: 18px
--fontWeight: 600
--color: #0f172a

STYLE emptyDesc
--fontSize: 14px
--color: #94a3b8

STYLE browseBtn
--marginTop: 8px
--paddingHorizontal: 24px
--paddingVertical: 12px
--borderRadius: 20px
--backgroundColor: #6366f1

STYLE browseBtnText
--color: #ffffff
--fontSize: 14px
--fontWeight: 600

STYLE favCard
--backgroundColor: #ffffff
--borderRadius: 14px
--overflow: hidden
--shadowColor: #000000
--shadowOffset: 0px 1px
--shadowOpacity: 0.06
--shadowRadius: 6px
--elevation: 2

STYLE favRow
--flexDirection: row
--padding: 12px
--gap: 12px
--alignItems: center

STYLE favCover
--width: 90px
--height: 90px
--borderRadius: 10px
--backgroundColor: #f1f5f9

STYLE favInfo
--flex: 1
--gap: 4px

STYLE favTitle
--fontSize: 15px
--fontWeight: 700
--color: #0f172a
--lineHeight: 20px

STYLE favMetaRow
--flexDirection: row
--alignItems: center
--gap: 4px

STYLE favMetaIcon
--fontSize: 12px

STYLE favMetaText
--fontSize: 12px
--color: #64748b

STYLE favPrice
--fontSize: 14px
--fontWeight: 700
--color: #f59e0b
--marginTop: 2px

STYLE unfavBtn
--width: 36px
--height: 36px
--borderRadius: 18px
--backgroundColor: #fef2f2
--alignItems: center
--justifyContent: center

STYLE unfavIconText
--fontSize: 18px

STYLE noMoreText
--textAlign: center
--fontSize: 13px
--color: #cbd5e1
--paddingVertical: 16px
