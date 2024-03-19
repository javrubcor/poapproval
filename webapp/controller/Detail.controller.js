/*global location */
sap.ui.define([
	"howdensPO/controller/BaseController",
	"sap/ui/model/json/JSONModel",
	"sap/ui/core/routing/History",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/m/GroupHeaderListItem",
	"sap/m/MessageBox",
	"howdensPO/model/formatter"
], function (BaseController, JSONModel, formatter) {
	"use strict";

	return BaseController.extend("howdensPO.controller.Detail", {

		formatter: formatter,

		/* =========================================================== */
		/* lifecycle methods                                           */
		/* =========================================================== */

		onInit: function () {
			// Model used to manipulate control states. The chosen values make sure,
			// detail page is busy indication immediately so there is no break in
			// between the busy indication for loading the view's meta data
			var oViewModel = new JSONModel({
				busy: false,
				delay: 0,
				lineItemListTitle: this.getResourceBundle().getText("detailLineItemTableHeading")
			});

			// var oI18nModel = new sap.ui.model.resource.ResourceModel({
			// 	bundleUrl: "i18n/i18n.properties"
			// });
			// sap.ui.getCore().setModel(oI18nModel, "i18n");

			this.getRouter().getRoute("object").attachPatternMatched(this._onObjectMatched, this);

			this.setModel(oViewModel, "detailView");

			this.getOwnerComponent().getModel().metadataLoaded().then(this._onMetadataLoaded.bind(this));

		},

		/* =========================================================== */
		/* event handlers                                              */
		/* =========================================================== */

		/* * Event handler when Details button has been clicked
		 * @public
		 */
		onDetailPress: function () {
			// Get the current purchase order object
			var oView = this.getView();
			oView.getModel().disableHeadRequestForToken = true;
			var oPurchaseOrder = oView.getModel().getProperty(oView.getBindingContext().sPath);

			var oBundle = this.getView().getModel("i18n").getResourceBundle();
			var sMsgTX = oBundle.getText("POTexts");
			var sMsgCL = oBundle.getText("Close");

			// HTML TAG
			var htmlText = oPurchaseOrder.Itemtxt; // text coming from Item

			// Pop Up Dialog Message START
			var dialog = new sap.m.Dialog({
				title: sMsgTX,
				type: "Message", //Standard",
				state: "Success", //None",
				//				contentWidth: "600px",
				//				contentHeight: "300px",
				resizable: true,
				content: [
					new sap.m.FormattedText("FormattedText", {
						//		convertLinksToAnchorTags: sap.m.LinkConversion.All,
						htmlText: htmlText,
						width: "100%",
						height: "auto"
					})
				],
				beginButton: new sap.m.Button({
					text: sMsgCL,
					type: "Reject", //"Default",
					press: function () {
						dialog.close();
					}
				}),
				afterClose: function () {
					dialog.destroy();
				}
			});

			dialog.open();
			// Pop Up Dialog message END			

		},

		/**
		 * Event handler when Approve button has been clicked
		 * @public
		 */
		onApprovePress: function () {
			// Get the current purchase order object
			var oView = this.getView();
			oView.getModel().disableHeadRequestForToken = true;
			var oPurchaseOrder = oView.getModel().getProperty(oView.getBindingContext().sPath);

			var oBundle = this.getView().getModel("i18n").getResourceBundle();

			var sMsgYA = oBundle.getText("YouareApproving");
			var sMsgVD = oBundle.getText("Vendor");
			var sMsgTA = oBundle.getText("TotalAmount");

			var sMsgAD = oBundle.getText("Add");
			var sMsgCO = oBundle.getText("Confirm");
			var sMsgCL = oBundle.getText("Cancel");

			// Pop Up Dialog Message START
			var dialog = new sap.m.Dialog({
				title: sMsgYA,
				type: "Message",
				state: "Success",
				content: [
					new sap.ui.layout.form.SimpleForm({
						editable: false,
						layout: "ResponsiveGridLayout",
						content: [
							new sap.m.Label({
								text: "PO No"
							}),
							new sap.m.Text({
								text: oPurchaseOrder.Ebeln
							}),
							new sap.m.Label({
								text: sMsgVD
							}),
							new sap.m.Text({
								text: oPurchaseOrder.Lifnr
							}),
							new sap.m.Label({
								text: sMsgTA
							}),
							new sap.m.Text({
								text: oPurchaseOrder.Netwr
							})
						]

					}),
					new sap.m.TextArea("confirmDialogTextarea", {
						width: "100%",
						placeholder: sMsgAD
					})
				],
				beginButton: new sap.m.Button({
					text: sMsgCO,
					activeIcon: "sap-icon://accept",
					icon: "sap-icon://accept",
					type: "Accept",
					press: function () {
						oPurchaseOrder.Rtext = sap.ui.getCore().byId("confirmDialogTextarea").getValue();
						oPurchaseOrder.Approved = "Y";

						oView.getModel().update(oView.getBindingContext().sPath, oPurchaseOrder, {
							success: function (oData, response) {
								if (response && response.headers && response.headers["sap-message"]) {
									if (JSON.parse(response.headers["sap-message"])) {
										if (JSON.parse(response.headers["sap-message"]).severity === "error") { //an error happened      
											sap.m.MessageBox.error(JSON.parse(response.headers["sap-message"]).message, {
												title: "{i18n>Error}"
											});
										}
									}
								} else {
									// sap.m.MessageToast.show(" {i18n>PurchaseOrder} " + oPurchaseOrder.Ebeln + " {i18n>isapproved} ", {
									// var sMsgPO = sap.ui.getCore().getModel("i18n").getResourceBundle().getText("PurchaseOrder");
									// var sMsgIA = sap.ui.getCore().getModel("i18n").getResourceBundle().getText("isapproved");

									// read msg from i18n model
									// var oBundle = this.getView().getModel("i18n").getResourceBundle();
									var sMsgPO = oBundle.getText("PurchaseOrder");
									var sMsgIA = oBundle.getText("isapproved");

									// var sMsgPO = sap.ui.getCore().getModel("i18n").getResourceBundle().getText("PurchaseOrder");
									// var sMsgIA = sap.ui.getCore().getModel("i18n").getResourceBundle().getText("isapproved");									

									sap.m.MessageToast.show(sMsgPO + " " + oPurchaseOrder.Ebeln + " " + sMsgIA, {
										duration: 4000,
										width: "20em"
									});
								}
							},
							error: function (oError) {
								var sErrorMsg = oBundle.getText("Therewas");
								if (oError && oError.responseText) {
									try {
										if (JSON.parse(oError.responseText) && JSON.parse(oError.responseText).error) { //an error happened
											sErrorMsg = JSON.parse(oError.responseText).error.message.value;
										}
									} catch (e) {
										if (oError.responseText.indexOf("timed out") !== -1) {
											sErrorMsg = oBundle.getText("Connectionout");  
										}
										if (oError.responseText.indexOf("Administrator") !== -1) {
											sErrorMsg = oBundle.getText("ST22");
										}
									}
								}
								sap.m.MessageToast.show(sErrorMsg, {
									duration: 4000,
									width: "20em",
									closeOnBrowserNavigation: false
								});
							}
						});
						dialog.close();
					}
				}),
				endButton: new sap.m.Button({
					text: sMsgCL,
					activeIcon: "sap-icon://reject",
					icon: "sap-icon://decline",
					type: "Reject",
					press: function () {
						dialog.close();
					}
				}),
				afterClose: function () {
					dialog.destroy();
				}
			});

			dialog.open();
			// Pop Up Dialog message END			

		},

		/**
		 * Event handler when Approve button has been clicked
		 * @public
		 */
		onRejectPress: function () {
			// Get the current purchase order object
			var oView = this.getView();
			oView.getModel().disableHeadRequestForToken = true;
			var oPurchaseOrder = oView.getModel().getProperty(oView.getBindingContext().sPath);

			var oBundle = this.getView().getModel("i18n").getResourceBundle();
			var sMsgYR = oBundle.getText("YouareRejecting");
			var sMsgAD = oBundle.getText("Add");
			// var sMsgRJ = oBundle.getText("Reject");
			// var sMsgIR = oBundle.getText("isrejected");

			var sMsgVD = oBundle.getText("Vendor");
			var sMsgTA = oBundle.getText("TotalAmount");

			// var sMsgAD = oBundle.getText("Add");
			var sMsgCO = oBundle.getText("Confirm");
			var sMsgCL = oBundle.getText("Cancel");


			// Pop Up Dialog Message START
			var dialog = new sap.m.Dialog({
				title: sMsgYR,
				type: "Message",
				state: "Warning",
				content: [
					new sap.ui.layout.form.SimpleForm({
						editable: false,
						layout: "ResponsiveGridLayout",
						content: [
							new sap.m.Label({
								text: "PO No"
							}),
							new sap.m.Text({
								text: oPurchaseOrder.Ebeln
							}),
							new sap.m.Label({
								text: sMsgVD
							}),
							new sap.m.Text({
								text: oPurchaseOrder.Lifnr
							}),
							new sap.m.Label({
								text: sMsgTA
							}),
							new sap.m.Text({
								text: oPurchaseOrder.Netwr
							})
						]

					}),
					new sap.m.TextArea("confirmDialogTextarea", {
						width: "100%",
						placeholder: sMsgAD
					})
				],
				beginButton: new sap.m.Button({
					text: sMsgCO,
					activeIcon: "sap-icon://reject",
					icon: "sap-icon://decline",
					type: "Reject",
					press: function () {
						oPurchaseOrder.Rtext = sap.ui.getCore().byId("confirmDialogTextarea").getValue();
						oPurchaseOrder.Approved = "N";

						oView.getModel().update(oView.getBindingContext().sPath, oPurchaseOrder, {
							success: function (oData, response) {
								if (response && response.headers && response.headers["sap-message"]) {
									if (JSON.parse(response.headers["sap-message"])) {
										if (JSON.parse(response.headers["sap-message"]).severity === "error") { //an error happened      
											sap.m.MessageBox.error(JSON.parse(response.headers["sap-message"]).message, {
												title: "Error" //Error message is sent from backend
											});
										}
									}
								} else {

									var sMsgPO = oBundle.getText("PurchaseOrder");
									var sMsgIR = oBundle.getText("isrejected");

									sap.m.MessageToast.show(sMsgPO + " " + oPurchaseOrder.Ebeln + " " + sMsgIR, {
										duration: 4000,
										width: "20em"
									});
								}
							},
							error: function (oError) {
								var sErrorMsg = oBundle.getText("Therewas");
								if (oError && oError.responseText) {
									try {
										if (JSON.parse(oError.responseText) && JSON.parse(oError.responseText).error) { //an error happened
											sErrorMsg = JSON.parse(oError.responseText).error.message.value;
										}
									} catch (e) {
										if (oError.responseText.indexOf("timed out") !== -1) {
											sErrorMsg = oBundle.getText("Connectionout");
										}
										if (oError.responseText.indexOf("Administrator") !== -1) {
											sErrorMsg = oBundle.getText("ST22");
										}
									}
								}
								sap.m.MessageToast.show(sErrorMsg, {
									duration: 4000,
									width: "20em",
									closeOnBrowserNavigation: false
								});
							}
						});
						dialog.close();
					}
				}),

				endButton: new sap.m.Button({
					text: sMsgCL,
					press: function () {
						dialog.close();
					}
				}),
				afterClose: function () {
					dialog.destroy();
				}
			});

			dialog.open();
			// Pop Up Dialog message END			

		},

		/**
		 * Event handler when the share by E-Mail button has been clicked
		 * @public
		 */
		onShareEmailPress: function () {
			var oViewModel = this.getModel("detailView");

			sap.m.URLHelper.triggerEmail(
				null,
				oViewModel.getProperty("/shareSendEmailSubject"),
				oViewModel.getProperty("/shareSendEmailMessage")
			);
		},

		/**
		 * Event handler when the share in JAM button has been clicked
		 * @public
		 */
		onShareInJamPress: function () {
			var oViewModel = this.getModel("detailView"),
				oShareDialog = sap.ui.getCore().createComponent({
					name: "sap.collaboration.components.fiori.sharing.dialog",
					settings: {
						object: {
							id: location.href,
							share: oViewModel.getProperty("/shareOnJamTitle")
						}
					}
				});

			oShareDialog.open();
		},

		/**
		 * Updates the item count within the line item table's header
		 * @param {object} oEvent an event containing the total number of items in the list
		 * @private
		 */
		onListUpdateFinished: function (oEvent) {
			var sTitle,
				iTotalItems = oEvent.getParameter("total"),
				oViewModel = this.getModel("detailView");

			// only update the counter if the length is final
			if (this.byId("lineItemsList").getBinding("items").isLengthFinal()) {
				if (iTotalItems) {
					sTitle = this.getResourceBundle().getText("detailLineItemTableHeadingCount", [iTotalItems]);
				} else {
					//Display 'Line Items' instead of 'Line items (0)'
					sTitle = this.getResourceBundle().getText("detailLineItemTableHeading");
				}
				oViewModel.setProperty("/lineItemListTitle", sTitle);
			}
		},

		/* =========================================================== */
		/* begin: internal methods                                     */
		/* =========================================================== */

		/**
		 * Binds the view to the object path and expands the aggregated line items.
		 * @function
		 * @param {sap.ui.base.Event} oEvent pattern match event in route 'object'
		 * @private
		 */
		_onObjectMatched: function (oEvent) {
			var sObjectId = oEvent.getParameter("arguments").objectId;
			this.getModel().metadataLoaded().then(function () {
				var sObjectPath = this.getModel().createKey("Header_infoSet", {
					Ebeln: sObjectId
				});
				this._bindView("/" + sObjectPath);
			}.bind(this));
		},

		/**
		 * Binds the view to the object path. Makes sure that detail view displays
		 * a busy indicator while data for the corresponding element binding is loaded.
		 * @function
		 * @param {string} sObjectPath path to the object to be bound to the view.
		 * @private
		 */
		_bindView: function (sObjectPath) {
			// Set busy indicator during view binding
			var oViewModel = this.getModel("detailView");

			// If the view was not bound yet its not busy, only if the binding requests data it is set to busy again
			oViewModel.setProperty("/busy", false);

			this.getView().bindElement({
				path: sObjectPath,
				events: {
					change: this._onBindingChange.bind(this),
					dataRequested: function () {
						oViewModel.setProperty("/busy", true);
					},
					dataReceived: function () {
						oViewModel.setProperty("/busy", false);
					}
				}
			});
		},

		_onBindingChange: function () {
			var oView = this.getView(),
				oElementBinding = oView.getElementBinding();

			// No data for the binding
			if (!oElementBinding.getBoundContext()) {
				//this.getRouter().getTa//rgets().display("detailObjectNotFound");
				// if object could not be found, the selection in the master list
				// does not make sense anymore.
				this.getOwnerComponent().oListSelector.clearMasterListSelection();
				return;
			}

			var sPath = oElementBinding.getPath(),
				oResourceBundle = this.getResourceBundle(),
				oObject = oView.getModel().getObject(sPath);

			//Start Change - 15/02/2018
			if (!oObject) {
				//the App was just opened and the URL is pointing to a PO that does not exist anymore
				this.getOwnerComponent().oListSelector.clearMasterListSelection();
				return;
			}
			//End Change - 15/02/2018

			var sObjectId = oObject.Ebeln,
				sObjectName = oObject.Ernam,
				oViewModel = this.getModel("detailView");

			this.getOwnerComponent().oListSelector.selectAListItem(sPath);

			oViewModel.setProperty("/saveAsTileTitle", oResourceBundle.getText("shareSaveTileAppTitle", [sObjectName]));
			oViewModel.setProperty("/shareOnJamTitle", sObjectName);
			oViewModel.setProperty("/shareSendEmailSubject",
				oResourceBundle.getText("shareSendEmailObjectSubject", [sObjectId]));
			oViewModel.setProperty("/shareSendEmailMessage",
				oResourceBundle.getText("shareSendEmailObjectMessage", [sObjectName, sObjectId, location.href]));
		},

		_onMetadataLoaded: function () {
			// Store original busy indicator delay for the detail view
			var iOriginalViewBusyDelay = this.getView().getBusyIndicatorDelay(),
				oViewModel = this.getModel("detailView"),
				oLineItemTable = this.byId("lineItemsList"),
				iOriginalLineItemTableBusyDelay = oLineItemTable.getBusyIndicatorDelay();

			// Make sure busy indicator is displayed immediately when
			// detail view is displayed for the first time
			oViewModel.setProperty("/delay", 0);
			oViewModel.setProperty("/lineItemTableDelay", 0);

			oLineItemTable.attachEventOnce("updateFinished", function () {
				// Restore original busy indicator delay for line item table
				oViewModel.setProperty("/lineItemTableDelay", iOriginalLineItemTableBusyDelay);
			});

			// Binding the view will set it to not busy - so the view is always busy if it is not bound
			oViewModel.setProperty("/busy", true);
			// Restore original busy indicator delay for the detail view
			oViewModel.setProperty("/delay", iOriginalViewBusyDelay);
		}

	});

});