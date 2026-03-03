// VL_VERSION:2.91

# Component Props
PROP title(STRING) = ""
PROP coverImage(STRING) = ""
PROP dateText(STRING) = ""
PROP venue(STRING) = ""
PROP musicType(STRING) = ""
PROP priceRange(STRING) = ""
PROP weatherIcon(STRING) = ""
PROP weatherTemp(STRING) = ""
PROP registrationCount(INT) = 0
PROP totalCapacity(INT) = 0

# Component Events
EVENT @tap()

# Component Tree
<Touchable "root"> @tap:@tap
--<Column "card"> style:card
----<Box "imageWrap"> style:imageWrap
------<Image "cover"> src:$coverImage style:coverImage resizeMode:cover
------<Box "typeBadge"> style:typeBadge
--------<Text "typeText"> text:$musicType style:typeText
------IF $weatherIcon != ""
------<Box "weatherWrap"> style:weatherWrap
--------<Text "wIcon"> text:$weatherIcon style:weatherIconText
--------<Text "wTemp"> text:$weatherTemp style:weatherTempText
----<Column "info"> style:info
------<Text "titleText"> text:$title style:titleText numberOfLines:2
------<Row "dateLine"> style:infoRow
--------<Text "dateIcon"> text:📅 style:iconText
--------<Text "dateVal"> text:$dateText style:infoText
------<Row "venueLine"> style:infoRow
--------<Text "venueIcon"> text:📍 style:iconText
--------<Text "venueVal"> text:$venue style:infoText numberOfLines:1
------<Row "bottom"> style:bottomRow
--------<Text "price"> text:$priceRange style:priceText
--------<Row "bottomRight"> style:bottomRight
----------<Box "regBadge"> style:regBadge
------------<Text "regText"> text:$registrationCount + "/" + $totalCapacity style:regText
----------<Touchable "favBtn"> @tap:@favorite style:favBtn
------------<Text "favIcon"> text:$isFavorited ? "❤️" : "🤍" style:favIconText
# Component Styles
STYLE card
--backgroundColor: #ffffff
--borderRadius: 12px
--overflow: hidden
--shadowColor: #000000
--shadowOffset: 0px 2px
--shadowOpacity: 0.08
--shadowRadius: 8px
--elevation: 3

STYLE imageWrap
--width: 100%
--height: 180px
--position: relative

STYLE coverImage
--width: 100%
--height: 100%

STYLE typeBadge
--position: absolute
--top: 12px
--left: 12px
--backgroundColor: rgba(99,102,241,0.9)
--paddingHorizontal: 10px
--paddingVertical: 4px
--borderRadius: 20px

STYLE typeText
--color: #ffffff
--fontSize: 11px
--fontWeight: 600

STYLE weatherWrap
--position: absolute
--top: 12px
--right: 12px
--flexDirection: row
--alignItems: center
--backgroundColor: rgba(0,0,0,0.5)
--paddingHorizontal: 8px
--paddingVertical: 4px
--borderRadius: 20px
--gap: 4px

STYLE weatherIconText
--fontSize: 14px

STYLE weatherTempText
--color: #ffffff
--fontSize: 11px
--fontWeight: 500

STYLE info
--padding: 14px
--gap: 8px

STYLE titleText
--fontSize: 16px
--fontWeight: 700
--color: #0f172a
--lineHeight: 22px

STYLE infoRow
--flexDirection: row
--alignItems: center
--gap: 6px

STYLE iconText
--fontSize: 13px

STYLE infoText
--fontSize: 13px
--color: #64748b
--flex: 1

STYLE bottomRow
--flexDirection: row
--alignItems: center
--justifyContent: space-between
--marginTop: 4px

STYLE priceText
--fontSize: 16px
--fontWeight: 700
--color: #f59e0b

STYLE regBadge
--backgroundColor: #f1f5f9
--paddingHorizontal: 10px
--paddingVertical: 4px
--borderRadius: 12px

STYLE regText
--fontSize: 12px
--color: #64748b
--fontWeight: 500

STYLE bottomRight
--flexDirection: row
--alignItems: center
--gap: 8px

STYLE favBtn
--width: 36px
--height: 36px
--borderRadius: 18px
--backgroundColor: #fef2f2
--alignItems: center
--justifyContent: center

STYLE favIconText
--fontSize: 18px
