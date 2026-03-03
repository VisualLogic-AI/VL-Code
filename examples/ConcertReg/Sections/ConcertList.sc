// VL_VERSION:2.91

# Frontend Variables
$concertList(JSON) = []
$keyword(STRING) = ""
$musicType(STRING) = ""
$dateStart(STRING) = ""
$dateEnd(STRING) = ""
$priceMin(STRING) = ""
$priceMax(STRING) = ""
$page(INT) = 1
$pageSize(INT) = 10
$total(INT) = 0
$loading(BOOL) = false
$showFilter(BOOL) = false
$favoritedIds(JSON) = []

# Frontend Tree
<Column "root"> style:root
--<Column "header"> style:header
----<Text "pageTitle"> text:🎵 露天音乐会 style:pageTitle
----<Text "pageSubtitle"> text:发现你的下一场音乐盛宴 style:pageSubtitle
--<Row "searchBar"> style:searchBar
----<TextInput "searchInput"> value:$keyword placeholder:搜索音乐会名称、场地... style:searchInput onChangeText:onKeywordChange onSubmitEditing:onSearch
----<Touchable "filterBtn"> @tap:onToggleFilter style:$showFilter ? filterBtnActive : filterBtn
------<Text "filterIcon"> text:🔍 style:filterBtnText
--IF $showFilter
--<Column "filterPanel"> style:filterPanel
----<Text "filterTitle"> text:筛选条件 style:filterTitle
----<Row "filterRow1"> style:filterRow
------<Touchable "typeAll"> @tap:onMusicTypeChange("") style:$musicType == "" ? chipActive : chip
--------<Text "typeAllText"> text:全部 style:$musicType == "" ? chipTextActive : chipText
------<Touchable "typePop"> @tap:onMusicTypeChange("流行") style:$musicType == "流行" ? chipActive : chip
--------<Text "typePopText"> text:流行 style:$musicType == "流行" ? chipTextActive : chipText
------<Touchable "typeRock"> @tap:onMusicTypeChange("摇滚") style:$musicType == "摇滚" ? chipActive : chip
--------<Text "typeRockText"> text:摇滚 style:$musicType == "摇滚" ? chipTextActive : chipText
------<Touchable "typeClassic"> @tap:onMusicTypeChange("古典") style:$musicType == "古典" ? chipActive : chip
--------<Text "typeClassicText"> text:古典 style:$musicType == "古典" ? chipTextActive : chipText
------<Touchable "typeFolk"> @tap:onMusicTypeChange("民谣") style:$musicType == "民谣" ? chipActive : chip
--------<Text "typeFolkText"> text:民谣 style:$musicType == "民谣" ? chipTextActive : chipText
------<Touchable "typeJazz"> @tap:onMusicTypeChange("爵士") style:$musicType == "爵士" ? chipActive : chip
--------<Text "typeJazzText"> text:爵士 style:$musicType == "爵士" ? chipTextActive : chipText
----<Row "filterActions"> style:filterActions
------<Touchable "resetBtn"> @tap:onResetFilter style:resetBtn
--------<Text "resetText"> text:重置 style:resetBtnText
------<Touchable "applyBtn"> @tap:onSearch style:applyBtn
--------<Text "applyText"> text:应用筛选 style:applyBtnText
--<ScrollView "concertScroll"> style:concertScroll onEndReached:onLoadMore
----<Column "concertGrid"> style:concertGrid
------IF $loading == true
------<Column "loadingWrap"> style:loadingWrap
--------<Text "loadingText"> text:加载中... style:loadingText
------IF $concertList.length == 0 AND $loading == false
------<Column "emptyState"> style:emptyState
--------<Text "emptyIcon"> text:🎶 style:emptyIcon
--------<Text "emptyTitle"> text:暂无音乐会 style:emptyTitle
--------<Text "emptyDesc"> text:敬请期待更多精彩演出 style:emptyDesc
------FOR $concert IN $concertList
------<ConcertCard "card"> title:$concert.title coverImage:$concert.coverImage dateText:$concert.startTime venue:$concert.venue musicType:$concert.musicType priceRange:"¥" + $concert.minPrice + " - ¥" + $concert.maxPrice weatherIcon:$concert.weatherIcon weatherTemp:$concert.weatherTemp registrationCount:$concert.registrationCount totalCapacity:$concert.totalCapacity @tap:onConcertTap($concert.id, $concert.title)
------IF $page * $pageSize < $total
------<Touchable "loadMoreBtn"> @tap:onLoadMore style:loadMoreBtn
--------<Text "loadMoreText"> text:加载更多 style:loadMoreText
------IF $page * $pageSize >= $total AND $concertList.length > 0
------<Text "noMoreText"> text:— 已经到底了 — style:noMoreText

# Frontend Event Handlers
HANDLER onLoad()
--SET $loading = true
--CALL ConcertDomain.listConcerts(page:$page, pageSize:$pageSize)
----ON SUCCESS
------SET $concertList = result.list
------SET $total = result.total
------SET $page = result.page
------SET $loading = false
------CALL ConcertDomain.checkFavorites(userId:"user001", concertIds:result.list.map(c => c.id))
--------ON SUCCESS
----------SET $favoritedIds = result.favoritedIds
----ON ERROR
------SET $loading = false
------TOAST "加载失败，请重试"

HANDLER onKeywordChange(text)
--SET $keyword = text

HANDLER onSearch()
--SET $page = 1
--SET $loading = true
--CALL ConcertDomain.searchConcerts(keyword:$keyword, musicType:$musicType, dateStart:$dateStart, dateEnd:$dateEnd, priceMin:$priceMin, priceMax:$priceMax, page:1, pageSize:$pageSize)
----ON SUCCESS
------SET $concertList = result.list
------SET $total = result.total
------SET $page = result.page
------SET $loading = false
----ON ERROR
------SET $loading = false
------TOAST "搜索失败，请重试"

HANDLER onConcertTap(concertId, concertTitle)
--NAVIGATE ConcertDetail WITH concertId:concertId, concertTitle:concertTitle

HANDLER onLoadMore()
--IF $page * $pageSize >= $total
----RETURN
--SET $page = $page + 1
--CALL ConcertDomain.searchConcerts(keyword:$keyword, musicType:$musicType, dateStart:$dateStart, dateEnd:$dateEnd, priceMin:$priceMin, priceMax:$priceMax, page:$page, pageSize:$pageSize)
----ON SUCCESS
------SET $concertList = $concertList.concat(result.list)
------SET $total = result.total
----ON ERROR
------SET $page = $page - 1
------TOAST "加载更多失败"

HANDLER onToggleFilter()
--SET $showFilter = !$showFilter

HANDLER onMusicTypeChange(type)
--SET $musicType = type

HANDLER onResetFilter()
--SET $musicType = ""
--SET $dateStart = ""
--SET $dateEnd = ""
--SET $priceMin = ""
--SET $priceMax = ""

# Frontend Styles
STYLE root
--flex: 1
--backgroundColor: #f8fafc

STYLE header
--paddingTop: 56px
--paddingBottom: 16px
--paddingHorizontal: 20px
--backgroundColor: #6366f1
--borderBottomLeftRadius: 24px
--borderBottomRightRadius: 24px

STYLE pageTitle
--fontSize: 28px
--fontWeight: 800
--color: #ffffff

STYLE pageSubtitle
--fontSize: 14px
--color: rgba(255,255,255,0.8)
--marginTop: 4px

STYLE searchBar
--flexDirection: row
--marginHorizontal: 20px
--marginTop: -22px
--backgroundColor: #ffffff
--borderRadius: 16px
--padding: 4px
--shadowColor: #000000
--shadowOffset: 0px 4px
--shadowOpacity: 0.1
--shadowRadius: 12px
--elevation: 4
--gap: 4px

STYLE searchInput
--flex: 1
--height: 44px
--paddingHorizontal: 16px
--fontSize: 14px
--color: #0f172a

STYLE filterBtn
--width: 44px
--height: 44px
--borderRadius: 12px
--backgroundColor: #f1f5f9
--alignItems: center
--justifyContent: center

STYLE filterBtnActive
--width: 44px
--height: 44px
--borderRadius: 12px
--backgroundColor: #6366f1
--alignItems: center
--justifyContent: center

STYLE filterBtnText
--fontSize: 18px

STYLE filterPanel
--marginHorizontal: 20px
--marginTop: 12px
--backgroundColor: #ffffff
--borderRadius: 16px
--padding: 16px
--gap: 12px
--shadowColor: #000000
--shadowOffset: 0px 2px
--shadowOpacity: 0.06
--shadowRadius: 8px
--elevation: 2

STYLE filterTitle
--fontSize: 14px
--fontWeight: 600
--color: #0f172a
--marginBottom: 4px

STYLE filterRow
--flexDirection: row
--flexWrap: wrap
--gap: 8px

STYLE chip
--paddingHorizontal: 14px
--paddingVertical: 8px
--borderRadius: 20px
--backgroundColor: #f1f5f9

STYLE chipActive
--paddingHorizontal: 14px
--paddingVertical: 8px
--borderRadius: 20px
--backgroundColor: #6366f1

STYLE chipText
--fontSize: 13px
--color: #64748b
--fontWeight: 500

STYLE chipTextActive
--fontSize: 13px
--color: #ffffff
--fontWeight: 600

STYLE filterActions
--flexDirection: row
--justifyContent: flex-end
--gap: 10px
--marginTop: 4px

STYLE resetBtn
--paddingHorizontal: 20px
--paddingVertical: 10px
--borderRadius: 10px
--borderWidth: 1px
--borderColor: #e2e8f0

STYLE resetBtnText
--fontSize: 13px
--color: #64748b
--fontWeight: 500

STYLE applyBtn
--paddingHorizontal: 20px
--paddingVertical: 10px
--borderRadius: 10px
--backgroundColor: #6366f1

STYLE applyBtnText
--fontSize: 13px
--color: #ffffff
--fontWeight: 600

STYLE concertScroll
--flex: 1

STYLE concertGrid
--padding: 20px
--gap: 16px
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
--gap: 8px

STYLE emptyIcon
--fontSize: 48px

STYLE emptyTitle
--fontSize: 18px
--fontWeight: 600
--color: #0f172a

STYLE emptyDesc
--fontSize: 14px
--color: #94a3b8

STYLE loadMoreBtn
--alignSelf: center
--paddingHorizontal: 24px
--paddingVertical: 12px
--borderRadius: 20px
--backgroundColor: #6366f1

STYLE loadMoreText
--fontSize: 13px
--color: #ffffff
--fontWeight: 600

STYLE noMoreText
--textAlign: center
--fontSize: 13px
--color: #cbd5e1
--paddingVertical: 16px
