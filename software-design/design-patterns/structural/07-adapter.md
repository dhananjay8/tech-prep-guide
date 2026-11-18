# Adapter Pattern

**Intent:** Convert an existing interface into one the client expects without
changing the adaptee. The separate Bridge pattern decouples an abstraction from
its implementation; it is not the same as Adapter.

**When to use:** Integrating third-party libraries, legacy code migration, normalizing different API responses.

---

## JavaScript
```javascript
// Old API (legacy)
class OldPaymentGateway {
  makePayment(amount, currency) { return { status: "OK", amt: amount, cur: currency }; }
}

// New expected interface
// { success: boolean, amount: number, currency: string }

// Adapter
class PaymentAdapter {
  constructor(oldGateway) { this.gateway = oldGateway; }

  processPayment(amount, currency) {
    const result = this.gateway.makePayment(amount, currency);
    return { success: result.status === "OK", amount: result.amt, currency: result.cur };
  }
}

const adapter = new PaymentAdapter(new OldPaymentGateway());
console.log(adapter.processPayment(100, "USD"));
// { success: true, amount: 100, currency: "USD" }
```

## Python
```python
# Third-party XML API
class XmlApi:
    def get_xml_data(self):
        return "<user><name>Alice</name></user>"

# Our app expects JSON
class JsonAdapter:
    def __init__(self, xml_api):
        self.xml_api = xml_api

    def get_json_data(self):
        import xml.etree.ElementTree as ET
        xml = self.xml_api.get_xml_data()
        root = ET.fromstring(xml)
        return {"name": root.find("name").text}

adapter = JsonAdapter(XmlApi())
print(adapter.get_json_data())  # {'name': 'Alice'}
```

## Java
```java
interface MediaPlayer { void play(String filename); }

class VlcPlayer { void playVlc(String file) { System.out.println("VLC: " + file); } }

class VlcAdapter implements MediaPlayer {
    private VlcPlayer vlc = new VlcPlayer();
    public void play(String filename) { vlc.playVlc(filename); }
}
```

## Interview Talking Points
- Wraps an existing class with a new interface **without modifying** the original
- Real-world: ORM adapters (same interface for MySQL/Postgres/MongoDB), API response normalization
- **vs Facade**: Adapter changes interface; Facade simplifies interface
- **vs Proxy**: Proxy has same interface; Adapter has different interface
- Normalize errors and define what happens when the adaptee returns malformed
  or incomplete data; translation is more than renaming fields.
