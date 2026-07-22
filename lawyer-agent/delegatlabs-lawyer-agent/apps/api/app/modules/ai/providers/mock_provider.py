import uuid
from app.modules.ai.providers.base import BaseAIProvider
from app.modules.ai.schemas import DraftGenerationRequest, DraftGenerationResponse


class MockAIProvider(BaseAIProvider):
    @property
    def provider_name(self) -> str:
        return "mock"

    @property
    def model_name(self) -> str:
        return "delegatlabs-mock-v1"

    def is_available(self) -> bool:
        return True

    def generate_draft(self, request: DraftGenerationRequest) -> DraftGenerationResponse:
        is_hindi = request.draftLanguage == "hi"
        owner_name = request.structuredFacts.get("Party Details", {}).get("Owner Full Name", "[Owner Name]")
        tenant_name = request.structuredFacts.get("Party Details", {}).get("Tenant Full Name", "[Tenant Name]")
        address = request.structuredFacts.get("Property Details", {}).get("Property Full Address", "[Property Address]")
        rent = request.structuredFacts.get("Rent & Deposit", {}).get("Monthly Rent Amount (INR)", "[Rent Amount]")
        deposit = request.structuredFacts.get("Rent & Deposit", {}).get("Security Deposit Amount (INR)", "[Deposit Amount]")
        duration = request.structuredFacts.get("Agreement Terms", {}).get("Agreement Duration (Months)", "[Duration]")
        start_date = request.structuredFacts.get("Agreement Terms", {}).get("Agreement Start Date", "[Start Date]")
        jurisdiction = request.jurisdiction

        if is_hindi:
            draft_text = f"""किरायानामा अनुबंध पत्र (RENT AGREEMENT)

यह किरायानामा अनुबंध पत्र आज दिनांक {start_date} को निम्नलिखित पक्षकारों के बीच निष्पादित किया गया:

प्रथम पक्ष (मकान मालिक/प्रथम पक्षकार):
श्रीमती/श्री {owner_name}, निवासी: {request.structuredFacts.get("Party Details", {}).get("Owner Residential Address", "[Owner Address]")} (जिन्हें आगे "मकान मालिक" कहा जाएगा)।

एवं

द्वितीय पक्ष (किरायेदार/द्वितीय पक्षकार):
श्रीमती/श्री {tenant_name}, निवासी: {request.structuredFacts.get("Party Details", {}).get("Tenant Residential Address", "[Tenant Address]")} (जिन्हें आगे "किरायेदार" कहा जाएगा)।

चूंकि मकान मालिक उपरोक्त संपत्ति: {address} का पूर्ण स्वामी है और किरायेदार को उक्त परिसर किराये पर देने के लिए सहमत हो गया है।

अब यह अनुबंध निम्नलिखित शर्तों के अधीन हस्ताक्षरित किया जा रहा है:

१. किराया अवधि और प्रभाव:
यह समझौता {start_date} से प्रभावी होगा और अगले {duration} महीनों की अवधि के लिए वैध रहेगा।

२. मासिक किराया एवं भुगतान:
किरायेदार मकान मालिक को प्रति माह {rent} रुपये (अंकों और शब्दों में) की मासिक किराया दर का भुगतान करने के लिए सहमत है। मासिक किराए का भुगतान प्रत्येक अंग्रेजी कैलेंडर माह की नियत तारीख तक किया जाएगा।

३. सुरक्षा जमा (Security Deposit):
किरायेदार ने मकान मालिक के पास {deposit} रुपये की ब्याज-मुक्त सुरक्षा जमा राशि जमा कराई है, जो इस समझौते की समाप्ति और किराये के परिसर का खाली कब्जा सौंपने पर वापस कर दी जाएगी।

४. उपयोग और रखरखाव:
किरायेदार उक्त परिसर का उपयोग केवल आवासीय प्रयोजनों के लिए करेगा और परिसर को अच्छी स्थिति में बनाए रखेगा।

५. क्षेत्राधिकार:
इस समझौते से उत्पन्न होने वाले किसी भी कानूनी विवाद का समाधान {jurisdiction} के न्यायालयों के क्षेत्राधिकार के अधीन होगा।

जिसके साक्ष्य के रूप में पक्षकारों ने गवाहों की उपस्थिति में निम्नलिखित हस्ताक्षरों द्वारा अपनी सहमति दर्ज की है।

हस्ताक्षर मकान मालिक: _____________________
हस्ताक्षर किरायेदार: _____________________

गवाह १: _____________________
गवाह २: _____________________
"""
        else:
            draft_text = f"""DEED OF RENT AGREEMENT

This Rent Agreement is made and executed on this {start_date} by and between:

LANDLORD (First Party):
Shri/Smt. {owner_name}, residing at: {request.structuredFacts.get("Party Details", {}).get("Owner Residential Address", "[Owner Address]")} (hereinafter referred to as the "LANDLORD").

AND

TENANT (Second Party):
Shri/Smt. {tenant_name}, residing at: {request.structuredFacts.get("Party Details", {}).get("Tenant Residential Address", "[Tenant Address]")} (hereinafter referred to as the "TENANT").

WHEREAS the Landlord is the absolute owner of the premises situated at: {address} and has agreed to let out the same to the Tenant on a monthly tenancy.

NOW THIS DEED WITNESSETH AND IT IS MUTUALLY AGREED BY AND BETWEEN THE PARTIES AS UNDER:

1. DURATION AND LEASE PERIOD:
That this lease agreement shall be effective from {start_date} and shall remain in force for a total duration of {duration} months.

2. MONTHLY RENTAL:
That the Tenant shall pay to the Landlord a monthly rent of INR {rent} (Rupees in words) on or before the due date of each calendar month.

3. SECURITY DEPOSIT:
That the Tenant has deposited an interest-free security deposit of INR {deposit} with the Landlord, refundable upon peaceful handover of the vacant possession of the premises.

4. MAINTENANCE AND BILLS:
That the Tenant shall pay electricity and water consumption charges directly to the concerned authorities and shall keep the premises in good condition.

5. COVENANT OF JURISDICTION:
That in case of any dispute arising out of this agreement, the courts at {jurisdiction} alone shall have the exclusive jurisdiction to try and decide the matter.

IN WITNESS WHEREOF, the parties hereto have set their respective hands and signatures on the day and year first above written in the presence of witnesses.

Signature of Landlord: _____________________
Signature of Tenant: _____________________

Witness 1: _____________________
Witness 2: _____________________
"""

        warnings = [
            "Generated by mock provider for development testing.",
            "This is a simulated output. Actual draft will be generated using AI model router endpoints."
        ]

        return DraftGenerationResponse(
            draftId=request.draftId,
            provider=self.provider_name,
            model=self.model_name,
            status="success",
            draftText=draft_text,
            warnings=warnings,
            generationId=f"gen-mock-{uuid.uuid4().hex[:8]}"
        )
