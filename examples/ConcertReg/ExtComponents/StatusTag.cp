// VL_VERSION:2.91

# Component Props
PROP text(STRING) = ""
PROP colorType(STRING) = "default"

# Component Tree
<Box "root"> style:$colorType == "success" ? tagSuccess : $colorType == "warning" ? tagWarning : $colorType == "error" ? tagError : $colorType == "info" ? tagInfo : $colorType == "urgent" ? tagUrgent : tagDefault
--<Text "label"> text:$text style:$colorType == "success" ? textSuccess : $colorType == "warning" ? textWarning : $colorType == "error" ? textError : $colorType == "info" ? textInfo : $colorType == "urgent" ? textUrgent : textDefault

# Component Styles
STYLE tagDefault
--backgroundColor: #f1f5f9
--paddingHorizontal: 10px
--paddingVertical: 3px
--borderRadius: 10px
--alignSelf: flex-start

STYLE tagSuccess
--backgroundColor: #dcfce7
--paddingHorizontal: 10px
--paddingVertical: 3px
--borderRadius: 10px
--alignSelf: flex-start

STYLE tagWarning
--backgroundColor: #fef3c7
--paddingHorizontal: 10px
--paddingVertical: 3px
--borderRadius: 10px
--alignSelf: flex-start

STYLE tagError
--backgroundColor: #fee2e2
--paddingHorizontal: 10px
--paddingVertical: 3px
--borderRadius: 10px
--alignSelf: flex-start

STYLE tagInfo
--backgroundColor: #dbeafe
--paddingHorizontal: 10px
--paddingVertical: 3px
--borderRadius: 10px
--alignSelf: flex-start

STYLE tagUrgent
--backgroundColor: #fee2e2
--paddingHorizontal: 10px
--paddingVertical: 3px
--borderRadius: 10px
--borderWidth: 1px
--borderColor: #ef4444
--alignSelf: flex-start

STYLE textDefault
--fontSize: 12px
--color: #64748b
--fontWeight: 500

STYLE textSuccess
--fontSize: 12px
--color: #16a34a
--fontWeight: 500

STYLE textWarning
--fontSize: 12px
--color: #d97706
--fontWeight: 500

STYLE textError
--fontSize: 12px
--color: #dc2626
--fontWeight: 500

STYLE textInfo
--fontSize: 12px
--color: #2563eb
--fontWeight: 500

STYLE textUrgent
--fontSize: 12px
--color: #dc2626
--fontWeight: 600
