// VL_VERSION:2.91

# Component Props
PROP columns(JSON) = []
PROP rows(JSON) = []
PROP page(INT) = 1
PROP pageSize(INT) = 10
PROP total(INT) = 0
PROP loading(BOOL) = false

# Component Events
EVENT @action(actionId(STRING), rowId(STRING))
EVENT @pageChange(page(INT))

# Component Variables
$_totalPages(INT) = 0

# Component Tree
<Column "root"> style:root
--IF $loading
--<Box "loadingWrap"> style:loadingWrap
----<Text "loadingText"> text:加载中... style:loadingLabel
--IF !$loading
--<ScrollView "tableScroll"> style:tableScroll horizontal:true
----<Column "table"> style:table
------<Row "headerRow"> style:headerRow
--------FOR $col IN $columns
--------<Box "headerCell"> style:headerCell
----------<Text "headerText"> text:$col.label style:headerText
------FOR $row IN $rows
------<Row "dataRow"> style:dataRow
--------FOR $col IN $columns
--------<Box "dataCell"> style:dataCell
----------IF $col.type != "actions"
----------<Text "cellText"> text:$row[$col.key] style:cellText numberOfLines:1
----------IF $col.type == "actions"
----------<Row "actionBtns"> style:actionBtns
------------FOR $act IN $col.actions
------------<Touchable "actBtn"> @tap:@action($act.id, $row.id)
--------------<Text "actText"> text:$act.label style:$act.danger ? actionTextDanger : actionText
--<Row "pagination"> style:pagination
----<Text "pageInfo"> text:"共 " + $total + " 条" style:pageInfoText
----<Row "pageButtons"> style:pageButtons
------<Touchable "prevBtn"> @tap:@pageChange($page - 1) disabled:$page <= 1
--------<Text "prevText"> text:上一页 style:$page <= 1 ? pageBtnDisabled : pageBtnText
------<Text "pageNum"> text:$page style:pageNumText
------<Touchable "nextBtn"> @tap:@pageChange($page + 1) disabled:$page * $pageSize >= $total
--------<Text "nextText"> text:下一页 style:$page * $pageSize >= $total ? pageBtnDisabled : pageBtnText

# Component Styles
STYLE root
--flex: 1

STYLE loadingWrap
--padding: 40px
--alignItems: center

STYLE loadingLabel
--fontSize: 14px
--color: #94a3b8

STYLE tableScroll
--flex: 1

STYLE table
--minWidth: 100%

STYLE headerRow
--flexDirection: row
--backgroundColor: #f8fafc
--borderBottomWidth: 1px
--borderBottomColor: #e2e8f0

STYLE headerCell
--paddingVertical: 12px
--paddingHorizontal: 14px
--minWidth: 120px

STYLE headerText
--fontSize: 13px
--fontWeight: 600
--color: #475569

STYLE dataRow
--flexDirection: row
--borderBottomWidth: 1px
--borderBottomColor: #f1f5f9

STYLE dataCell
--paddingVertical: 12px
--paddingHorizontal: 14px
--minWidth: 120px
--justifyContent: center

STYLE cellText
--fontSize: 13px
--color: #0f172a

STYLE actionBtns
--flexDirection: row
--gap: 12px

STYLE actionText
--fontSize: 13px
--color: #6366f1
--fontWeight: 500

STYLE actionTextDanger
--fontSize: 13px
--color: #ef4444
--fontWeight: 500

STYLE pagination
--flexDirection: row
--justifyContent: space-between
--alignItems: center
--paddingVertical: 12px
--paddingHorizontal: 14px
--borderTopWidth: 1px
--borderTopColor: #e2e8f0

STYLE pageInfoText
--fontSize: 13px
--color: #64748b

STYLE pageButtons
--flexDirection: row
--alignItems: center
--gap: 12px

STYLE pageBtnText
--fontSize: 13px
--color: #6366f1
--fontWeight: 500

STYLE pageBtnDisabled
--fontSize: 13px
--color: #cbd5e1

STYLE pageNumText
--fontSize: 14px
--color: #0f172a
--fontWeight: 600
