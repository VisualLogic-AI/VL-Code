// VL_VERSION:2.91

# Component Props
PROP zones(JSON) = []
PROP selectedZoneId(STRING) = ""
PROP disabled(BOOL) = false

# Component Events
EVENT @selectZone(zoneId(STRING), zoneName(STRING), price(FLOAT))

# Component Variables
$_zoneColors(JSON) = ["#8b5cf6", "#6366f1", "#3b82f6", "#22c55e", "#f59e0b"]

# Component Tree
<Column "root"> style:root
--<Text "stageLabel"> text:🎵 舞台 style:stageLabel
--<Box "stagePlatform"> style:stagePlatform
----<Text "stageText"> text:STAGE style:stageText
--<Column "zoneList"> style:zoneList
----FOR $zone IN $zones
----<Touchable "zoneItem"> @tap:@selectZone($zone.id, $zone.zoneName, $zone.price) disabled:$disabled
------<Row "zoneRow"> style:$zone.id == $selectedZoneId ? zoneRowSelected : zoneRow
--------<Box "zoneColor"> style:zoneColorDot
--------<Column "zoneInfo"> style:zoneInfo
----------<Text "zoneName"> text:$zone.zoneName style:zoneName
----------<Text "zoneSeats"> text:"剩余 " + $zone.remainingSeats + "/" + $zone.capacity + " 座" style:zoneSeats
--------<Text "zonePrice"> text:"¥" + $zone.price style:zonePrice
--<Row "legend"> style:legend
----<Box "legendAvailable"> style:legendDot
----<Text "legendAvailableText"> text:可选 style:legendText
----<Box "legendSelected"> style:legendDotSelected
----<Text "legendSelectedText"> text:已选 style:legendText
----<Box "legendFull"> style:legendDotFull
----<Text "legendFullText"> text:已满 style:legendText

# Component Styles
STYLE root
--padding: 16px
--gap: 16px

STYLE stageLabel
--textAlign: center
--fontSize: 16px
--fontWeight: 600
--color: #0f172a

STYLE stagePlatform
--backgroundColor: #6366f1
--borderRadius: 12px 12px 40px 40px
--paddingVertical: 20px
--alignItems: center
--marginHorizontal: 40px

STYLE stageText
--color: #ffffff
--fontSize: 14px
--fontWeight: 700
--letterSpacing: 4px

STYLE zoneList
--gap: 8px
--marginTop: 8px

STYLE zoneRow
--flexDirection: row
--alignItems: center
--padding: 14px
--backgroundColor: #f8fafc
--borderRadius: 12px
--borderWidth: 2px
--borderColor: transparent
--gap: 12px

STYLE zoneRowSelected
--flexDirection: row
--alignItems: center
--padding: 14px
--backgroundColor: #ede9fe
--borderRadius: 12px
--borderWidth: 2px
--borderColor: #6366f1
--gap: 12px

STYLE zoneColorDot
--width: 12px
--height: 12px
--borderRadius: 6px
--backgroundColor: #6366f1

STYLE zoneInfo
--flex: 1
--gap: 2px

STYLE zoneName
--fontSize: 14px
--fontWeight: 600
--color: #0f172a

STYLE zoneSeats
--fontSize: 12px
--color: #64748b

STYLE zonePrice
--fontSize: 18px
--fontWeight: 700
--color: #f59e0b

STYLE legend
--flexDirection: row
--justifyContent: center
--gap: 20px
--marginTop: 8px

STYLE legendDot
--width: 10px
--height: 10px
--borderRadius: 5px
--backgroundColor: #6366f1

STYLE legendDotSelected
--width: 10px
--height: 10px
--borderRadius: 5px
--backgroundColor: #ede9fe
--borderWidth: 2px
--borderColor: #6366f1

STYLE legendDotFull
--width: 10px
--height: 10px
--borderRadius: 5px
--backgroundColor: #e2e8f0

STYLE legendText
--fontSize: 12px
--color: #64748b
