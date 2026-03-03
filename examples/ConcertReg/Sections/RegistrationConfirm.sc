// VL_VERSION:2.91

# Frontend Variables
$concertId(STRING) = ""
$zoneId(STRING) = ""
$quantity(INT) = 1
$totalPrice(FLOAT) = 0
$concertTitle(STRING) = ""
$zoneName(STRING) = ""
$contactName(STRING) = ""
$contactPhone(STRING) = ""
$contactEmail(STRING) = ""
$submitting(BOOL) = false
$submitSuccess(BOOL) = false
$registrationResult(JSON) = {}
$phoneError(STRING) = ""
$nameError(STRING) = ""

# Frontend Tree
<Column "root"> style:root
--<Row "navBar"> style:navBar
----<Touchable "backBtn"> @tap:onBack style:navBackBtn
------<Text "backIcon"> text:← style:navBackIcon
----<Text "navTitle"> text:确认报名 style:navTitle
----<Box "navSpacer"> style:navSpacer
--<ScrollView "scroll"> style:scroll
----<Column "body"> style:body
------<Column "orderCard"> style:orderCard
--------<Text "orderTitle"> text:📋 订单摘要 style:cardTitle
--------<Box "orderDivider"> style:cardDivider
--------<Row "orderRow1"> style:orderRow
----------<Text "label1"> text:音乐会 style:orderLabel
----------<Text "value1"> text:$concertTitle style:orderValue numberOfLines:2
--------<Row "orderRow2"> style:orderRow
----------<Text "label2"> text:座位区域 style:orderLabel
----------<Text "value2"> text:$zoneName style:orderValue
--------<Row "orderRow3"> style:orderRow
----------<Text "label3"> text:数量 style:orderLabel
----------<Text "value3"> text:$quantity + " 张" style:orderValue
--------<Box "orderDivider2"> style:cardDivider
--------<Row "totalRow"> style:totalRow
----------<Text "totalLabel"> text:总计 style:totalLabel
----------<Text "totalValue"> text:"¥" + $totalPrice style:totalValue
------<Column "contactCard"> style:contactCard
--------<Text "contactTitle"> text:👤 联系信息 style:cardTitle
--------<Box "contactDivider"> style:cardDivider
--------<Column "fieldGroup1"> style:fieldGroup
----------<Text "nameLabel"> text:联系人姓名 * style:fieldLabel
----------<TextInput "nameInput"> value:$contactName placeholder:请输入联系人姓名 style:fieldInput onChangeText:onContactNameChange
----------IF $nameError != ""
----------<Text "nameErrorText"> text:$nameError style:fieldError
--------<Column "fieldGroup2"> style:fieldGroup
----------<Text "phoneLabel"> text:手机号码 * style:fieldLabel
----------<TextInput "phoneInput"> value:$contactPhone placeholder:请输入手机号码 keyboardType:phone-pad style:fieldInput onChangeText:onContactPhoneChange
----------IF $phoneError != ""
----------<Text "phoneErrorText"> text:$phoneError style:fieldError
--------<Column "fieldGroup3"> style:fieldGroup
----------<Text "emailLabel"> text:邮箱地址 style:fieldLabelOptional
----------<TextInput "emailInput"> value:$contactEmail placeholder:选填，用于接收报名确认 keyboardType:email-address style:fieldInput onChangeText:onContactEmailChange
------<Column "tipsCard"> style:tipsCard
--------<Text "tipsTitle"> text:⚠️ 温馨提示 style:tipsCardTitle
--------<Text "tip1"> text:1. 本活动为露天音乐会，请关注当日天气预报 style:tipText
--------<Text "tip2"> text:2. 请携带有效身份证件及电子票到场 style:tipText
--------<Text "tip3"> text:3. 报名成功后可在演出前24小时免费取消 style:tipText
--------<Text "tip4"> text:4. 每笔订单最多购买5张票 style:tipText
------<Box "bottomSpacer"> style:bottomSpacer
--<Box "fixedBottom"> style:fixedBottom
----<Touchable "submitBtn"> @tap:onSubmit style:$submitting ? submitBtnDisabled : submitBtn
------<Text "submitText"> text:$submitting ? "提交中..." : "确认报名 ¥" + $totalPrice style:submitBtnText
--IF $submitSuccess
--<Box "successOverlay"> style:successOverlay
----<Column "successModal"> style:successModal
------<Text "successIcon"> text:🎉 style:successEmoji
------<Text "successTitle"> text:报名成功！ style:successTitle
------<Text "successDesc"> text:您的电子票已生成 style:successDesc
------<Box "ticketCodeBox"> style:ticketCodeBox
--------<Text "ticketCodeLabel"> text:电子票号 style:ticketCodeLabel
--------<Text "ticketCodeValue"> text:$registrationResult.ticketCode style:ticketCodeValue
------<Touchable "viewTicketBtn"> @tap:onViewTicket style:viewTicketBtn
--------<Text "viewTicketText"> text:🎫 查看电子票 style:viewTicketText
------<Touchable "goRegistrationsBtn"> @tap:onGoToMyRegistrations style:goRegistrationsBtn
--------<Text "goRegistrationsText"> text:查看我的报名 style:goRegistrationsText

# Frontend Event Handlers
HANDLER onBack()
--NAVIGATE BACK

HANDLER onContactNameChange(text)
--SET $contactName = text
--SET $nameError = ""

HANDLER onContactPhoneChange(text)
--SET $contactPhone = text
--SET $phoneError = ""

HANDLER onContactEmailChange(text)
--SET $contactEmail = text

HANDLER onSubmit()
--IF $contactName == ""
----SET $nameError = "请填写联系人姓名"
----RETURN
--IF $contactPhone == ""
----SET $phoneError = "请填写手机号码"
----RETURN
--IF $contactPhone.length != 11
----SET $phoneError = "请输入正确的11位手机号"
----RETURN
--SET $submitting = true
--CALL RegistrationDomain.createRegistration(userId:"user001", concertId:$concertId, zoneId:$zoneId, quantity:$quantity, totalPrice:$totalPrice, contactName:$contactName, contactPhone:$contactPhone, contactEmail:$contactEmail)
----ON SUCCESS
------SET $registrationResult = result.registration
------SET $submitSuccess = true
------SET $submitting = false
----ON ERROR
------SET $submitting = false
------TOAST "报名失败: " + error.message

HANDLER onViewTicket()
--NAVIGATE TicketView WITH registrationId:$registrationResult.id

HANDLER onGoToMyRegistrations()
--NAVIGATE MyRegistrations

# Frontend Styles
STYLE root
--flex: 1
--backgroundColor: #f8fafc

STYLE navBar
--flexDirection: row
--alignItems: center
--paddingTop: 48px
--paddingBottom: 12px
--paddingHorizontal: 16px
--backgroundColor: #ffffff
--borderBottomWidth: 1px
--borderBottomColor: #f1f5f9

STYLE navBackBtn
--width: 40px
--height: 40px
--alignItems: center
--justifyContent: center

STYLE navBackIcon
--fontSize: 20px
--fontWeight: 700
--color: #0f172a

STYLE navTitle
--flex: 1
--fontSize: 17px
--fontWeight: 700
--color: #0f172a
--textAlign: center

STYLE navSpacer
--width: 40px

STYLE scroll
--flex: 1

STYLE body
--padding: 16px
--gap: 16px
--paddingBottom: 120px

STYLE orderCard
--backgroundColor: #ffffff
--borderRadius: 16px
--padding: 20px
--gap: 14px
--shadowColor: #000000
--shadowOffset: 0px 2px
--shadowOpacity: 0.06
--shadowRadius: 8px
--elevation: 2

STYLE cardTitle
--fontSize: 16px
--fontWeight: 700
--color: #0f172a

STYLE cardDivider
--height: 1px
--backgroundColor: #f1f5f9

STYLE orderRow
--flexDirection: row
--justifyContent: space-between
--alignItems: flex-start

STYLE orderLabel
--fontSize: 14px
--color: #94a3b8
--width: 70px

STYLE orderValue
--fontSize: 14px
--color: #0f172a
--fontWeight: 600
--flex: 1
--textAlign: right

STYLE totalRow
--flexDirection: row
--justifyContent: space-between
--alignItems: center

STYLE totalLabel
--fontSize: 16px
--fontWeight: 700
--color: #0f172a

STYLE totalValue
--fontSize: 24px
--fontWeight: 800
--color: #f59e0b

STYLE contactCard
--backgroundColor: #ffffff
--borderRadius: 16px
--padding: 20px
--gap: 14px
--shadowColor: #000000
--shadowOffset: 0px 2px
--shadowOpacity: 0.06
--shadowRadius: 8px
--elevation: 2

STYLE fieldGroup
--gap: 6px

STYLE fieldLabel
--fontSize: 13px
--fontWeight: 600
--color: #0f172a

STYLE fieldLabelOptional
--fontSize: 13px
--fontWeight: 500
--color: #64748b

STYLE fieldInput
--height: 46px
--borderWidth: 1.5px
--borderColor: #e2e8f0
--borderRadius: 12px
--paddingHorizontal: 14px
--fontSize: 14px
--color: #0f172a
--backgroundColor: #f8fafc

STYLE fieldError
--fontSize: 12px
--color: #ef4444
--fontWeight: 500

STYLE tipsCard
--backgroundColor: #fffbeb
--borderRadius: 16px
--padding: 18px
--gap: 8px
--borderWidth: 1px
--borderColor: #fde68a

STYLE tipsCardTitle
--fontSize: 14px
--fontWeight: 700
--color: #92400e

STYLE tipText
--fontSize: 13px
--color: #92400e
--lineHeight: 20px

STYLE bottomSpacer
--height: 20px

STYLE fixedBottom
--position: absolute
--bottom: 0
--left: 0
--right: 0
--padding: 16px
--paddingBottom: 32px
--backgroundColor: #ffffff
--borderTopWidth: 1px
--borderTopColor: #f1f5f9
--shadowColor: #000000
--shadowOffset: 0px -2px
--shadowOpacity: 0.06
--shadowRadius: 8px
--elevation: 4

STYLE submitBtn
--backgroundColor: #6366f1
--borderRadius: 14px
--paddingVertical: 16px
--alignItems: center

STYLE submitBtnDisabled
--backgroundColor: #cbd5e1
--borderRadius: 14px
--paddingVertical: 16px
--alignItems: center

STYLE submitBtnText
--color: #ffffff
--fontSize: 16px
--fontWeight: 700

STYLE successOverlay
--position: absolute
--top: 0
--left: 0
--right: 0
--bottom: 0
--backgroundColor: rgba(0,0,0,0.5)
--justifyContent: center
--alignItems: center

STYLE successModal
--backgroundColor: #ffffff
--borderRadius: 24px
--padding: 32px
--width: 320px
--alignItems: center
--gap: 12px

STYLE successEmoji
--fontSize: 48px

STYLE successTitle
--fontSize: 22px
--fontWeight: 800
--color: #0f172a

STYLE successDesc
--fontSize: 14px
--color: #64748b

STYLE ticketCodeBox
--backgroundColor: #f8fafc
--borderRadius: 12px
--padding: 16px
--width: 100%
--alignItems: center
--gap: 4px
--marginVertical: 4px

STYLE ticketCodeLabel
--fontSize: 12px
--color: #94a3b8

STYLE ticketCodeValue
--fontSize: 14px
--fontWeight: 700
--color: #6366f1
--fontFamily: monospace

STYLE viewTicketBtn
--backgroundColor: #6366f1
--borderRadius: 14px
--paddingVertical: 14px
--width: 100%
--alignItems: center

STYLE viewTicketText
--color: #ffffff
--fontSize: 15px
--fontWeight: 700

STYLE goRegistrationsBtn
--paddingVertical: 10px

STYLE goRegistrationsText
--fontSize: 14px
--color: #6366f1
--fontWeight: 600
