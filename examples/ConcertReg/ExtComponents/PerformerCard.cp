// VL_VERSION:2.91

# Component Props
PROP name(STRING) = ""
PROP avatarUrl(STRING) = ""
PROP genre(STRING) = ""
PROP bio(STRING) = ""
PROP representative(STRING) = ""
PROP showActions(BOOL) = false

# Component Events
EVENT @tap()
EVENT @edit()
EVENT @delete()

# Component Tree
<Touchable "root"> @tap:@tap
--<Row "card"> style:card
----<Image "avatar"> src:$avatarUrl style:avatar
----<Column "info"> style:info
------<Text "nameText"> text:$name style:nameText
------<Row "genreRow"> style:genreRow
--------<Box "genreBadge"> style:genreBadge
----------<Text "genreText"> text:$genre style:genreText
------IF $representative != ""
------<Text "repText"> text:$representative style:repText numberOfLines:1
------IF $bio != ""
------<Text "bioText"> text:$bio style:bioText numberOfLines:2
----IF $showActions
----<Row "actions"> style:actions
------<Touchable "editBtn"> @tap:@edit
--------<Text "editIcon"> text:✏️ style:actionIcon
------<Touchable "deleteBtn"> @tap:@delete
--------<Text "deleteIcon"> text:🗑️ style:actionIcon

# Component Styles
STYLE card
--flexDirection: row
--padding: 14px
--backgroundColor: #ffffff
--borderRadius: 12px
--alignItems: center
--gap: 14px
--shadowColor: #000000
--shadowOffset: 0px 1px
--shadowOpacity: 0.05
--shadowRadius: 4px

STYLE avatar
--width: 56px
--height: 56px
--borderRadius: 28px

STYLE info
--flex: 1
--gap: 4px

STYLE nameText
--fontSize: 15px
--fontWeight: 600
--color: #0f172a

STYLE genreRow
--flexDirection: row

STYLE genreBadge
--backgroundColor: #ede9fe
--paddingHorizontal: 8px
--paddingVertical: 2px
--borderRadius: 10px

STYLE genreText
--fontSize: 11px
--color: #7c3aed
--fontWeight: 500

STYLE repText
--fontSize: 12px
--color: #64748b

STYLE bioText
--fontSize: 12px
--color: #94a3b8
--lineHeight: 18px

STYLE actions
--flexDirection: row
--alignItems: center
--gap: 8px

STYLE actionIcon
--fontSize: 18px
--padding: 6px
