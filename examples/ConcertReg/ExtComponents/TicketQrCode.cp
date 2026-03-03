// VL_VERSION:2.91

# Component Props
PROP ticketCode(STRING) = ""
PROP concertTitle(STRING) = ""
PROP dateText(STRING) = ""
PROP venue(STRING) = ""
PROP zoneName(STRING) = ""
PROP quantity(INT) = 1
PROP status(STRING) = "confirmed"

# Component Events
EVENT @save()

# Component Tree
<Column "root"> style:root
--<Box "ticketCard"> style:ticketCard
----<Column "header"> style:header
------<Text "logo"> text:🎵 style:logo
------<Text "title"> text:$concertTitle style:title numberOfLines:2
------<Box "statusBadge"> style:$status == "confirmed" ? statusConfirmed : statusCancelled
--------<Text "statusText"> text:$status == "confirmed" ? "有效" : $status == "used" ? "已使用" : "已取消" style:statusBadgeText
----<Box "dividerLine"> style:dividerLine
----<Column "qrSection"> style:qrSection
------<Box "qrPlaceholder"> style:qrPlaceholder
--------<Text "qrCode"> text:$ticketCode style:qrCodeText
--------<Text "qrLabel"> text:入场扫码 style:qrLabel
----<Box "dividerLine2"> style:dividerLine
----<Column "details"> style:details
------<Row "detailRow1"> style:detailRow
--------<Text "dateLabel"> text:时间 style:detailLabel
--------<Text "dateValue"> text:$dateText style:detailValue
------<Row "detailRow2"> style:detailRow
--------<Text "venueLabel"> text:地点 style:detailLabel
--------<Text "venueValue"> text:$venue style:detailValue
------<Row "detailRow3"> style:detailRow
--------<Text "zoneLabel"> text:区域 style:detailLabel
--------<Text "zoneValue"> text:$zoneName style:detailValue
------<Row "detailRow4"> style:detailRow
--------<Text "qtyLabel"> text:数量 style:detailLabel
--------<Text "qtyValue"> text:$quantity + " 张" style:detailValue
------<Row "detailRow5"> style:detailRow
--------<Text "codeLabel"> text:票号 style:detailLabel
--------<Text "codeValue"> text:$ticketCode style:detailValueCode
--<Touchable "saveBtn"> @tap:@save style:saveBtn
----<Text "saveBtnText"> text:💾 保存至相册 style:saveBtnText

# Component Styles
STYLE root
--alignItems: center
--padding: 20px

STYLE ticketCard
--backgroundColor: #ffffff
--borderRadius: 16px
--width: 300px
--overflow: hidden
--shadowColor: #000000
--shadowOffset: 0px 4px
--shadowOpacity: 0.12
--shadowRadius: 16px
--elevation: 5

STYLE header
--alignItems: center
--paddingTop: 24px
--paddingBottom: 16px
--paddingHorizontal: 20px
--gap: 8px

STYLE logo
--fontSize: 32px

STYLE title
--fontSize: 18px
--fontWeight: 700
--color: #0f172a
--textAlign: center

STYLE statusConfirmed
--backgroundColor: #dcfce7
--paddingHorizontal: 12px
--paddingVertical: 4px
--borderRadius: 12px

STYLE statusCancelled
--backgroundColor: #fee2e2
--paddingHorizontal: 12px
--paddingVertical: 4px
--borderRadius: 12px

STYLE statusBadgeText
--fontSize: 12px
--fontWeight: 600
--color: #16a34a

STYLE dividerLine
--height: 1px
--backgroundColor: #e2e8f0
--marginHorizontal: 20px

STYLE qrSection
--alignItems: center
--paddingVertical: 20px

STYLE qrPlaceholder
--width: 180px
--height: 180px
--backgroundColor: #f8fafc
--borderRadius: 12px
--borderWidth: 2px
--borderColor: #e2e8f0
--alignItems: center
--justifyContent: center
--gap: 8px

STYLE qrCodeText
--fontSize: 10px
--color: #94a3b8
--textAlign: center
--paddingHorizontal: 8px

STYLE qrLabel
--fontSize: 12px
--color: #64748b
--fontWeight: 500

STYLE details
--padding: 16px
--paddingTop: 12px
--gap: 10px

STYLE detailRow
--flexDirection: row
--alignItems: flex-start

STYLE detailLabel
--width: 48px
--fontSize: 13px
--color: #94a3b8
--fontWeight: 500

STYLE detailValue
--flex: 1
--fontSize: 13px
--color: #0f172a
--fontWeight: 500

STYLE detailValueCode
--flex: 1
--fontSize: 11px
--color: #6366f1
--fontWeight: 600
--fontFamily: monospace

STYLE saveBtn
--marginTop: 16px
--backgroundColor: #6366f1
--borderRadius: 12px
--paddingVertical: 14px
--paddingHorizontal: 32px

STYLE saveBtnText
--color: #ffffff
--fontSize: 15px
--fontWeight: 600
