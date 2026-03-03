// VL_VERSION:2.91

# Component Props
PROP icon(STRING) = ""
PROP title(STRING) = ""
PROP value(STRING) = "0"
PROP unit(STRING) = ""
PROP trend(STRING) = "up"
PROP trendValue(STRING) = ""
PROP bgColor(STRING) = "#6366f1"

# Component Events
EVENT @tap()

# Component Tree
<Touchable "root"> @tap:@tap
--<Row "card"> style:card
----<Box "iconWrap"> style:iconWrap
------<Text "iconText"> text:$icon style:iconText
----<Column "content"> style:content
------<Text "titleText"> text:$title style:titleText
------<Row "valueRow"> style:valueRow
--------<Text "valueText"> text:$value style:valueText
--------IF $unit != ""
--------<Text "unitText"> text:$unit style:unitText
------IF $trendValue != ""
------<Row "trendRow"> style:trendRow
--------<Text "trendIcon"> text:$trend == "up" ? "↑" : "↓" style:$trend == "up" ? trendUp : trendDown
--------<Text "trendText"> text:$trendValue style:$trend == "up" ? trendUp : trendDown

# Component Styles
STYLE card
--flexDirection: row
--padding: 16px
--backgroundColor: #ffffff
--borderRadius: 12px
--alignItems: center
--gap: 14px
--shadowColor: #000000
--shadowOffset: 0px 1px
--shadowOpacity: 0.05
--shadowRadius: 4px
--elevation: 2

STYLE iconWrap
--width: 48px
--height: 48px
--borderRadius: 12px
--backgroundColor: #ede9fe
--alignItems: center
--justifyContent: center

STYLE iconText
--fontSize: 22px

STYLE content
--flex: 1
--gap: 4px

STYLE titleText
--fontSize: 13px
--color: #64748b
--fontWeight: 500

STYLE valueRow
--flexDirection: row
--alignItems: baseline
--gap: 4px

STYLE valueText
--fontSize: 24px
--fontWeight: 700
--color: #0f172a

STYLE unitText
--fontSize: 13px
--color: #94a3b8
--fontWeight: 500

STYLE trendRow
--flexDirection: row
--alignItems: center
--gap: 4px

STYLE trendUp
--fontSize: 12px
--color: #22c55e
--fontWeight: 600

STYLE trendDown
--fontSize: 12px
--color: #ef4444
--fontWeight: 600
