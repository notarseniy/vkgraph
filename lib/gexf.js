"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var lodash_1 = require("lodash");
var xmlwriter_1 = require("./xmlwriter");
function formatToGexf(nodes, edges, attribute_conf) {
    var xw = new xmlwriter_1.default('UTF-8', '1.0');
    var attrmap = lodash_1.default.object(lodash_1.default.map(attribute_conf, function (attr) {
        return [attr.title, attr];
    }));
    var writeAttributes = function () {
        xw.writeStartElement("attributes");
        xw.writeAttributeString("class", "node");
        attribute_conf.forEach(function (attr) {
            xw.writeStartElement("attribute");
            xw.writeAttributeString("id", attr.id);
            xw.writeAttributeString("title", attr.title);
            xw.writeAttributeString("type", attr.type);
            if (attr.default !== undefined) {
                xw.writeElementString("default", attr.default.toString());
            }
            xw.writeEndElement();
        });
        xw.writeEndElement();
    };
    var writeNodes = function () {
        xw.writeStartElement("nodes");
        nodes.forEach(function (node) {
            xw.writeStartElement("node");
            xw.writeAttributeString("id", node.id);
            xw.writeAttributeString("label", node.label);
            xw.writeStartElement("attvalues");
            lodash_1.default.each(node.attrs, function (value, key) {
                if (value !== undefined && value !== null) {
                    xw.writeStartElement("attvalue");
                    xw.writeAttributeString("for", attrmap[key].id);
                    xw.writeAttributeString("value", value.toString());
                    xw.writeEndElement();
                }
            });
            xw.writeEndElement();
            xw.writeEndElement();
        });
        xw.writeEndElement();
    };
    var writeEdges = function () {
        xw.writeStartElement("edges");
        edges.forEach(function (edge) {
            xw.writeStartElement("edge");
            xw.writeAttributeString("id", edge.id);
            xw.writeAttributeString("source", edge.source);
            xw.writeAttributeString("target", edge.target);
            xw.writeEndElement();
        });
        xw.writeEndElement();
    };
    var writeAll = function () {
        xw.writeStartDocument();
        xw.writeStartElement("gexf");
        xw.writeAttributeString("xmlns", "http://www.gexf.net/1.2draft");
        xw.writeAttributeString("xmlns:xsi", "http://www.w3.org/2001/XMLSchema-instance");
        xw.writeAttributeString("xsi:schemaLocation", "http://www.gexf.net/1.2draft http://www.gexf.net/1.2draft/gexf.xsd");
        xw.writeAttributeString("version", "1.2");
        xw.writeStartElement("graph");
        xw.writeAttributeString("defaultedgetype", "directed");
        writeAttributes();
        writeNodes();
        writeEdges();
        return xw.flush();
    };
    return writeAll();
}
exports.formatToGexf = formatToGexf;
