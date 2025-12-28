sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/m/MessageToast",
    "sap/ui/core/Fragment",
    "sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
    "zfiflujoreqdoc/model/formatter",
    "sap/m/MessageBox"
],
function (Controller, MessageToast, Fragment, Filter, FilterOperator, formatter, MessageBox) {
    "use strict";

    return Controller.extend("zfiflujoreqdoc.controller.Main", {

        formatter: formatter,

        onInit: function () {
            this.oRouter = this.getOwnerComponent().getRouter();
            this.ZSERV_PPL_GETID_SRV = this.getOwnerComponent().getModel("ZSERV_PPL_GETID_SRV");
            this.ZSERV_PPL_FLUJOID_SH_SRV = this.getOwnerComponent().getModel("ZSERV_PPL_FLUJOID_SH_SRV");
            this.ZSERV_PPL_GETDOCS_PROV_SRV = this.getOwnerComponent().getModel("ZSERV_PPL_GETDOCS_PROV_SRV");
            this.ZSERV_PPL_CREAFLUJO_SRV = this.getOwnerComponent().getModel("ZSERV_PPL_CREAFLUJO_SRV");
            this.ZSERV_PPL_SHELP_SRV = this.getOwnerComponent().getModel("ZSERV_PPL_SHELP_SRV");
            this.ZSERV_PPL_PRINT_SRV = this.getOwnerComponent().getModel("ZSERV_PPL_PRINT_SRV");
            this.ZSERV_PPL_CHECKUSR_SRV = this.getOwnerComponent().getModel("ZSERV_PPL_CHECKUSR_SRV");
            this.ZSER_PPL_SHELP_REQ_SRV = this.getOwnerComponent().getModel("ZSER_PPL_SHELP_REQ_SRV");
            this.ZSER_PPL_DATA_REQ_SRV = this.getOwnerComponent().getModel("ZSER_PPL_DATA_REQ_SRV");
            this.oFlujos = this.getOwnerComponent().getModel("Flujos");
            this.oAprobadores = this.getOwnerComponent().getModel("Aprobadores");
            this.oSociedades = this.getOwnerComponent().getModel("Sociedades");
            this.oAcreedores = this.getOwnerComponent().getModel("Acreedores");
            this.oMonedas = this.getOwnerComponent().getModel("Monedas");
            this.oAdjuntos = this.getOwnerComponent().getModel("Adjuntos");
            this.oDocumentos = this.getOwnerComponent().getModel("Documentos");
            this.oDocumentosSeleccionados = this.getOwnerComponent().getModel("DocumentosSeleccionados");
            this.oRequisiciones = this.getOwnerComponent().getModel("Requisiciones");
            this.oRouter.getRoute("RouteMain").attachPatternMatched(this._onObjectMatched, this);
            this.oBundle = this.getOwnerComponent().getModel("i18n").getResourceBundle();
        },

        _onObjectMatched: async function () {
            this.aAprobadores = []
            this.oAdjuntos.setData([]);
            this.oDocumentosSeleccionados.setData([]);
            this.cboxRequisicion = this.getView().byId("cboxRequisicion");
            this.txtAObservaciones = this.getView().byId("txtAObservaciones");
            this.inptConcepto = this.getView().byId("inptConcepto");
            this.inptCorreo = this.getView().byId("inptCorreo");
            this.cboxFlujo = this.getView().byId("cboxFlujo");
            this.cboxSociedad = this.getView().byId("cboxSociedad");
            this.cboxAcreedor = this.getView().byId("cboxAcreedor");
            this.cboxMoneda = this.getView().byId("cboxMoneda");
            this.inptImporte = this.getView().byId("inptImporte");
            this.rbgMetodoPago = this.getView().byId("rbgMetodoPago");
            this.btnBuscarDocs = this.getView().byId("btnBuscarDocs");
            this.btnBuscarDocs.setText(this.oBundle.getText("form.documentos.seleccionados", [0]))

            if (sap.ushell && sap.ushell.Container) {
                this.oUser = sap.ushell.Container.getUser();
                this.sUserId = this.oUser.getId();
                this.sUserId = "RREYES";
            } else {
                this.sUserId = "RREYES";
            }
            console.log("Usuario Fiori:", this.sUserId);

            const valid = await this._onValidateUser();

            if(!valid){
                MessageBox.alert('Usuario no autorizado para generar flujos. Registrese en Transacción "ZPPL_UPD_CTRLCON" e intente de nuevo.');
                return
            } else {
                this.onCargarDropdowns();
                this.onCargarRequisiciones();
            }
		},

        onCargarDropdowns: function (){
            const that = this;
            const aValores = ["1", "2", "3", "4"];
            const aPromesas = aValores.map((valor) => {
                return new Promise((resolve, reject) => {
                    this.ZSERV_PPL_FLUJOID_SH_SRV.read("/InputSet", {
                    urlParameters: {
                      "$filter": `Campo eq '${valor}'`,
                      "$expand": "ValNav,AprobNav"
                    },
                    success: function (oData) {
                        resolve(oData.results);
                    },
                    error: function (oError) {
                      reject(oError);
                    }
                  });
                });
            });

            Promise.all(aPromesas).then((aResultados) => {
                const aAllResponse = aResultados.flat();
                that.oFlujos.setData(aAllResponse[0]["ValNav"]["results"]);
                that.aAprobadores = aAllResponse[0]["AprobNav"]["results"];
                that.oSociedades.setData(aAllResponse[1]["ValNav"]["results"]);
                that.oMonedas.setData(aAllResponse[3]["ValNav"]["results"]);
            }).catch((err) => {
                console.error("Error al consultar el OData:", err);
            });
        },

        onCargarRequisiciones: function () {
            const that = this;
            this.ZSER_PPL_SHELP_REQ_SRV.read("/RequisicionSet", {
                urlParameters: {
                    "format": "json"
                },
                success: function (oData) {
                    that.oRequisiciones.setData(oData["results"]);
                },
                error: function (oError) {
                    MessageToast.show("No fue posible cargar las requisiciones creadas.");
                }
            });
        },

        onFilterAprobadores: function(value) {
            if(value){
                var aAprobadoresFiltrados = [];
                if (value !== "" && value !== null && value !== undefined){
                    aAprobadoresFiltrados = this.aAprobadores.filter(item => item.Id_flow === value);
                }
                this.oAprobadores.setData(aAprobadoresFiltrados);
            } else {
                this.oAprobadores.setData([]);
            }
        },

        onChangeArchivo: function (oEvent) {
            const that = this;
            const oFile = oEvent.getParameter("files")[0];
        
            if (oFile) {
                const oUploader = oEvent.getSource();
                const reader = new FileReader();
        
                reader.onload = function (evt) {
                    const arrayBuffer = evt.target.result;
                    const byteArray = new Uint8Array(arrayBuffer);
                    const sHex = Array.from(byteArray)
                        .map(byte => byte.toString(16).padStart(2, '0'))
                        .join('');
        
                    const aData = that.oAdjuntos.getData() || [];
        
                    const bExists = aData.some(function (item) {
                        return item.File_name === oFile.name;
                    });
        
                    if (bExists) {
                        MessageToast.show("El archivo ya fue cargado.");
                        oUploader.setValue("");
                        return;
                    }
        
                    aData.push({
                        File_name: oFile.name,
                        File_cont: sHex,
                        File_type: oFile.type,
                        ProductPicUrl: "",
                    });
        
                    that.oAdjuntos.setData(aData);
                    oUploader.setValue("");
                };
        
                reader.readAsArrayBuffer(oFile);
            }
        },        

        onEliminarArchivo: function (oEvent) {
            var oItem = oEvent.getParameter("listItem");
            var oContext = oItem.getBindingContext("Adjuntos");
            var sPath = oContext.getPath();
            var iIndex = parseInt(sPath.split("/")[1], 10);
        
            var aData = this.oAdjuntos.getData();
            aData.splice(iIndex, 1);
            this.oAdjuntos.setData(aData);
        },

        onBuscarDocumentos: function() {
            if(!this.oReqSelected) {
                MessageToast.show("Seleccione una requisición.");
                return
            }

            const sociedad = this.oReqSelected["SOCIEDAD"];
            const acreedor = this.oReqSelected["PROVEEDOR"];
            const moneda = this.oReqSelected["MONEDA"];

            if(sociedad === null || sociedad === "" || sociedad === undefined) {
                MessageToast.show("Seleccione una sociedad.");
                return
            } else if (acreedor === null || acreedor === "" || acreedor === undefined){
                MessageToast.show("Seleccione un acreedor.");
                return
            } else if (moneda === null || moneda === "" || moneda === undefined){
                MessageToast.show("Seleccione una moneda.");
                return
            } else {
                if (!this._oDialogDocumentos) {
                    Fragment.load({
                        id: this.getView().createId("dDocumentos"),
                        name: "zfiflujoreqdoc.view.fragment.Documentos",
                        controller: this
                    }).then(function (oDialog) {
                        this._oDialogDocumentos = oDialog;
                        this.getView().addDependent(oDialog);
                        oDialog.open();
                        this.onLoadDocumentos(sociedad, formatter.formatearFechaSAP(this.oReqSelected["FECHA_DOC"]), acreedor, moneda)
                    }.bind(this));
                } else {
                    this._oDialogDocumentos.open();
                }
            }
        },

        onCloseDialog: function() {
            this._oDialogDocumentos.close();
        },

        onLoadDocumentos: function(sociedad, fecha, proveedor, moneda) {
            const that = this;
            return new Promise(function (resolve, reject) {
                const aFilter = [];

                aFilter.push(new Filter("Soc", FilterOperator.EQ, sociedad));
                aFilter.push(new Filter("Fec", FilterOperator.EQ, fecha));
                aFilter.push(new Filter("Prov", FilterOperator.EQ, proveedor));
                aFilter.push(new Filter("Mon", FilterOperator.EQ, moneda));
        
                that.ZSERV_PPL_GETDOCS_PROV_SRV.read("/InputSet", {
                    filters: aFilter,
                    urlParameters: {
                        "format": "json",
                        "$expand": "Indocnav"
                    },
                    success: function (response) {
                        const aDocs = response?.results?.[0]?.Indocnav?.results || [];
                        that.oDocumentos.setData(aDocs);
                        resolve();
                    },
                    error: function (error) {
                        that.oDocumentos.setData([]);
                        reject(error);
                    }
                });
            });
        },

        onSeleccionarDocs: function () {
            const oTable = Fragment.byId(this.createId("dDocumentos"), "tblDocumentos");
            const aSelectedItems = oTable.getSelectedItems();
            let importe = 0;
        
            const aNuevosSeleccionados = [];
        
            aSelectedItems.forEach(item => {
                const oContext = item.getBindingContext("Documentos");
                const oDoc = oContext.getObject();
                oDoc["Bldat"] = formatter.formatearFechaSAP(oDoc["Bldat"]);
                importe += parseFloat(oDoc["Dmshb"])
                aNuevosSeleccionados.push(oDoc);
            });

            if(importe > this.oReqSelected["IMPORTE"]) {
                MessageToast.show("El importe de los documentos seleccionados excede el importe de la requisición.");
                return;
            }

            const currency = this.oReqSelected["MONEDA"];
            const importeFormateado = new Intl.NumberFormat('es-MX', {
                style: 'currency',
                currency: currency
            }).format(importe);
            this.inptImporte.setValue(importeFormateado);
            this.oDocumentosSeleccionados.setData(aNuevosSeleccionados);
        
            if (aNuevosSeleccionados.length > 0) {
                this.btnBuscarDocs.setText(this.oBundle.getText("form.documentos.seleccionados", [aNuevosSeleccionados.length]))
                MessageToast.show(this.oBundle.getText("form.documentos.seleccionados", [aNuevosSeleccionados.length]));
            } else {
                MessageToast.show("No se seleccionó ningún documento.");
            }

            this._oDialogDocumentos.close();
        },

        preseleccionarDocumentos: function () {
            const oTable = Fragment.byId(this.createId("dDocumentos"), "tblDocumentos");
            const aItems = oTable.getItems();
            const aSeleccionados = this.oDocumentosSeleccionados.getData() || [];
        
            aItems.forEach(item => {
                const oContext = item.getBindingContext("Documentos");
                const oDoc = oContext.getObject();
                const bExiste = aSeleccionados.some(d => {
                    const keys = Object.keys(oDoc).filter(k => k !== "__metadata");
                    return keys.every(k => d[k] === oDoc[k]);
                });
                if (bExiste) {
                    oTable.setSelectedItem(item, true);
                }
            });
        },

        onIniciarFlujo: function() {
            const that = this;
            const oView = this.getView();
            oView.setBusy(true);
            const flujo = this.oReqSelected["FLUJO_ID"];
            const requisicion = this.oReqSelected["REQ_ID"];
            const sociedad = this.oReqSelected["SOCIEDAD"];
            const acreedor = this.oReqSelected["PROVEEDOR"];
            const moneda = this.oReqSelected["MONEDA"];
            const fecha = this.oReqSelected["FECHA"];
            const concepto = this.oReqSelected["CONCEPTO"];
            const correo = this.oReqSelected["CORREO"];
            const importe = this.oReqSelected["IMPORTE"];
            const documentos = this.oDocumentosSeleccionados.getData();

            if (documentos.length === 0){
                MessageToast.show("Seleccione al menos un documento.");
                oView.setBusy(false);
                return;
            } else {
                let body = {
                    "Flujo_id" : flujo,
                    "Req_id" : requisicion,
                    "Sociedad" : sociedad,
                    "Proveedor" : acreedor,
                    "Moneda" : moneda,
                    "Fecha": fecha,
                    "Concepto" : concepto,
                    "Correo" : correo,
                    "Importe": importe,
                    "HeaderDocsNav": documentos.map(documento => ({
                        Xblnr: documento.Xblnr,
                        Belnr: documento.Belnr,
                        Blart: documento.Blart,
                        Bldat: documento.Bldat,
                        Dmshb: documento.Dmshb,
                        Hwaer: documento.Hwaer,
                        Wrshb: documento.Wrshb,
                        Waers: documento.Waers,
                        Gjahr: documento.Gjahr
                    }))
                }
                console.log({body});
                this.ZSERV_PPL_CREAFLUJO_SRV.create("/HeaderSet", body, {
                    headers: {
                        "Content-Type": "application/json;charset=utf-8"
                    },
                    success: function (response) {
                        console.log(response)
                        MessageToast.show("Se agregaron los documentos, ya puede crear la propuesta de pago.");
                        oView.setBusy(false);
                        that.onResetFields();
                    },
                    error: function (error) {
                        console.log(error)
                        oView.setBusy(false);
                        try {
                            const errorMsg = JSON.parse(error.responseText).error.message.value;
                            MessageToast.show(errorMsg || "Ocurrió un error al crear el flujo.");
                        } catch (e) {
                            MessageToast.show("Ocurrió un error al crear el flujo.");
                        }
                    }
                });
            }
        },

        onLoadAcreedores: function (value){
            const that = this;

            const aFilter = [
                new Filter("Campo", FilterOperator.EQ, '3'),
                new Filter("Sociedad", FilterOperator.EQ, value)
            ];

            this.ZSERV_PPL_SHELP_SRV.read("/InputHelpSet", {
                filters: aFilter,
                urlParameters: {
                    "format": "json",
                    "$expand": "VALNAV"
                },
                success: function (oData) {
                    const aAcreedores = oData["results"][0]["VALNAV"]["results"];
                    const acreedor = aAcreedores.filter(item => item.Valor === that.oReqSelected["PROVEEDOR"]);
                    that.oAcreedores.setData(acreedor);
                    that.cboxAcreedor.setSelectedKey(that.oReqSelected["PROVEEDOR"]);
                },
                error: function (oError) {
                    console.log(oError)
                    that.oAcreedores.setData([]);
                }
            });
        },

        onResetFields: function() {
            this.cboxRequisicion.setSelectedKey();
            this.cboxFlujo.setSelectedKey(null);
            this.cboxSociedad.setSelectedKey(null);
            //this.txtAObservaciones.setValue(null);
            //this.rbgMetodoPago.setSelectedIndex(0);
            this.inptImporte.setValue(null);
            //this.cboxMoneda.setSelectedKey(null);
            this.inptConcepto.setValue(null);
            this.cboxAcreedor.setSelectedKey(null);
            this.inptCorreo.setValue(null);
            this.oAdjuntos.setData([]);
            this.oDocumentos.setData([]);
            this.oAprobadores.setData([]);
            this.btnBuscarDocs.setText(this.oBundle.getText("form.documentos.seleccionados", [0]))
        },

        onImprimirRequisicion: function() {
            const requisicion = this.cboxRequisicion.getSelectedKey();
            const flujo = this.cboxFlujo.getSelectedKey();
            const sociedad = this.cboxSociedad.getSelectedKey();
            const acreedor = this.cboxAcreedor.getSelectedKey();
            const moneda = this.cboxMoneda.getSelectedKey();
            const concepto = this.inptConcepto.getValue();
            const correo = this.inptCorreo.getValue();
            const importe = this.inptImporte.getValue().replace("$", "").replace(",", "");
            const comentarios = this.txtAObservaciones.getValue();
            const metodoPago = this.rbgMetodoPago.getSelectedIndex() + 1;

            let body = {
                "FlujoId" : flujo,
                "ReqId" : requisicion,
                "Sociedad" : sociedad,
                "Proveedor" : acreedor,
                "Moneda" : moneda,
                "Concepto" : concepto,
                "Correo" : correo,
                "Importe": importe,
                "MetodoP": metodoPago.toString(),
                "Observaciones": comentarios
            }

            this.ZSERV_PPL_PRINT_SRV.create("/DataprintSet", body, {
                headers: {
                    "Content-Type": "application/json;charset=utf-8"
                },
                success: function (response) {
                    console.log(response)
                    MessageToast.show("Se envió a imprimir la requisición.");
                },
                error: function (error) {
                    console.log(error)
                    MessageToast.show("Ocurrió un error al imprimir.");
                }
            });
        },

        _onValidateUser: function () {
            return new Promise((resolve) => {
                this.ZSERV_PPL_CHECKUSR_SRV.read(`/IDSet('${this.sUserId}')`, {
                    urlParameters: { format: "json" },
                    success: (oData) => resolve(oData.Crea === "X"),
                    error: () => resolve(false)
                });
            });
        },

        onRequisicionChange: function (oEvent) {
            const that = this;
            this.ZSER_PPL_DATA_REQ_SRV.read("/HeadSet", {
                filters: [
                    new Filter("REQ_ID", FilterOperator.EQ, oEvent.getSource().getSelectedKey())
                ],
                urlParameters: {
                    "format": "json",
                    "$expand": "Headnav"
                },
                success: function (oData) {
                    console.log(oData)
                    that.onFilterAprobadores(oData["results"][0]["FLUJO_ID"]);
                    that.onLoadAcreedores(oData["results"][0]["SOCIEDAD"]);
                    that.oReqSelected = oData["results"][0];
                    that.cboxSociedad.setSelectedKey(oData["results"][0]["SOCIEDAD"]);
                    that.cboxFlujo.setSelectedKey(oData["results"][0]["FLUJO_ID"]);
                    that.inptImporte.setValue(formatter.formatearImporte(oData["results"][0]["IMPORTE"], oData["results"][0]["MONEDA"]));
                    that.inptConcepto.setValue(oData["results"][0]["CONCEPTO"]);
                    that.inptCorreo.setValue(oData["results"][0]["CORREO"]);
                },
                error: function (oError) {
                    MessageToast.show("No fue posible obtener los datos de la requisición.");
                }
            });
        }
    });
});
