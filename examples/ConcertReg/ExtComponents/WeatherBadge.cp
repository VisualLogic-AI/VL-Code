// VL_VERSION:2.91

# Component Props
PROP weatherIcon(STRING) = "sun"
PROP temperature(STRING) = ""
PROP description(STRING) = ""
PROP showTip(BOOL) = false
PROP tip(STRING) = ""

# Component Events
EVENT @tap()

# Component Tree
<Box "root"> @tap:@tap style:badge
--<Row "mainRow"> style:mainRow
----<Box "iconBg"> style:iconBg
------<Text "wIcon"> text:$weatherIcon style:wIcon
----<Column "info"> style:info
------<Text "temp"> text:$temperature style:temp
------IF $description != ""
------<Text "desc"> text:$description style:desc
--IF $showTip == true
--<Row "tipRow"> style:tipBox
----<Text "tipIcon"> text:⚠️ style:tipIcon
----<Text "tipText"> text:$tip style:tipText

# Component Styles
STYLE badge
--backgroundColor: #fffbeb
--borderRadius: 14px
--padding: 14px
--borderWidth: 1px
--borderColor: #fde68a

STYLE mainRow
--flexDirection: row
--alignItems: center
--gap: 12px

STYLE iconBg
--width: 44px
--height: 44px
--borderRadius: 22px
--backgroundColor: #fef3c7
--justifyContent: center
--alignItems: center

STYLE wIcon
--fontSize: 24px
--color: #f59e0b

STYLE info
--flex: 1

STYLE temp
--fontSize: 18px
--fontWeight: 700
--color: #92400e

STYLE desc
--fontSize: 13px
--color: #b45309
--marginTop: 2px

STYLE tipBox
--flexDirection: row
--alignItems: center
--gap: 8px
--marginTop: 12px
--paddingTop: 12px
--borderTopWidth: 1px
--borderTopColor: #fde68a

STYLE tipIcon
--fontSize: 14px

STYLE tipText
--fontSize: 12px
--color: #92400e
--flex: 1
