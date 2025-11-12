Perfect! So `TblSensorischeAnalyse` (singular) stores individual **responses** from testers. Now based on your `Analysis` interface and how you're using the data, you need a **parent table** to store the analysis metadata. Here's what's **MISSING**:

## New Table Needed: `tbl_SensorischeAnalyseMeta`

This stores the overall analysis configuration (what you currently have in cookies):

```sql
CREATE TABLE tbl_SensorischeAnalyseMeta (
    -- Primary Key
    SAMetaGUID UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    
    -- Foreign Keys
    SAMetaProjectID UNIQUEIDENTIFIER NOT NULL,
        CONSTRAINT FK_SAMeta_Project 
        FOREIGN KEY (SAMetaProjectID) 
        REFERENCES tbl_Projecten(ProjectGUID),
    
    SAMetaCoordinatorID UNIQUEIDENTIFIER NULL,
        CONSTRAINT FK_SAMeta_Coordinator 
        FOREIGN KEY (SAMetaCoordinatorID) 
        REFERENCES tbl_Contacten(ContactGUID),
    
    -- Analysis Info
    SAMetaCode NVARCHAR(100) NULL,  -- e.g., project code + date
    SAMetaOmschrijving NVARCHAR(500) NULL,
    
    -- Status & Lifecycle
    SAMetaActief BIT NULL DEFAULT 0,  -- Currently active (12h window)
    SAMetaGeactiveerd DATETIME NULL,  -- When activated
    SAMetaVervaldatum DATETIME NULL,  -- Expiry (activation + 12h)
    SAMetaStatus NVARCHAR(50) NULL,  -- 'draft', 'active', 'completed', 'archived'
    
    -- Timing
    SAMetaAangemaakt DATETIME NULL DEFAULT GETDATE(),
    SAMetaGestart DATETIME NULL,  -- When first tester started
    SAMetaAfgerond DATETIME NULL,  -- When completed
    
    -- Configuration
    SAMetaAantalKamers INT NULL,  -- Number of rooms (1-8)
        CONSTRAINT CHK_SAMeta_Kamers CHECK (SAMetaAantalKamers BETWEEN 1 AND 8),
    SAMetaAantalPanelleden INT NULL,
    
    -- Audit
    SAMetaGewijzigdDoor NVARCHAR(255) NULL,
    SAMetaGewijzigdOp DATETIME NULL,
    
    CONSTRAINT CHK_SAMeta_Status 
        CHECK (SAMetaStatus IN ('draft', 'active', 'completed', 'archived'))
);

CREATE INDEX IX_SAMeta_Project ON tbl_SensorischeAnalyseMeta(SAMetaProjectID);
CREATE INDEX IX_SAMeta_Status ON tbl_SensorischeAnalyseMeta(SAMetaStatus, SAMetaActief);
```

## New Table Needed: `tbl_SensorischeAnalyseKamers`

Stores which monsters are assigned to which rooms for each analysis:

```sql
CREATE TABLE tbl_SensorischeAnalyseKamers (
    -- Primary Key
    SAKamerGUID UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    
    -- Foreign Keys
    SAKamerMetaID UNIQUEIDENTIFIER NOT NULL,
        CONSTRAINT FK_SAKamer_Meta 
        FOREIGN KEY (SAKamerMetaID) 
        REFERENCES tbl_SensorischeAnalyseMeta(SAMetaGUID) 
        ON DELETE CASCADE,
    
    SAKamerMonsterID UNIQUEIDENTIFIER NOT NULL,
        CONSTRAINT FK_SAKamer_Monster 
        FOREIGN KEY (SAKamerMonsterID) 
        REFERENCES tbl_Monsters(MonsterGUID),
    
    SAKamerMonsternameID UNIQUEIDENTIFIER NULL,
        CONSTRAINT FK_SAKamer_Monstername 
        FOREIGN KEY (SAKamerMonsternameID) 
        REFERENCES tbl_Monstername(MonsternameGUID),
    
    -- Room Info
    SAKamerNummer INT NOT NULL,  -- Physical room (1-8)
        CONSTRAINT CHK_SAKamer_Nummer CHECK (SAKamerNummer BETWEEN 1 AND 8),
    
    SAKamerMonsterCode NVARCHAR(50) NULL,  -- Denormalized from tbl_Monsters
    
    -- Audit
    SAKamerGewijzigdDoor NVARCHAR(255) NULL,
    SAKamerGewijzigdOp DATETIME NULL,
    
    CONSTRAINT UQ_SAKamer_Meta_Room UNIQUE (SAKamerMetaID, SAKamerNummer)
);

CREATE INDEX IX_SAKamer_Meta ON tbl_SensorischeAnalyseKamers(SAKamerMetaID);
CREATE INDEX IX_SAKamer_Monster ON tbl_SensorischeAnalyseKamers(SAKamerMonsterID);
```

## New Table Needed: `tbl_SensorischeAnalysePanelleden`

Stores panel members and tracks their progress:

```sql
CREATE TABLE tbl_SensorischeAnalysePanelleden (
    -- Primary Key
    SAPanelidGUID UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    
    -- Foreign Keys
    SAPanelidMetaID UNIQUEIDENTIFIER NOT NULL,
        CONSTRAINT FK_SAPanelid_Meta 
        FOREIGN KEY (SAPanelidMetaID) 
        REFERENCES tbl_SensorischeAnalyseMeta(SAMetaGUID) 
        ON DELETE CASCADE,
    
    SAPanelidContactID UNIQUEIDENTIFIER NOT NULL,
        CONSTRAINT FK_SAPanelid_Contact 
        FOREIGN KEY (SAPanelidContactID) 
        REFERENCES tbl_Contacten(ContactGUID),
    
    -- Progress
    SAPanelidGestart DATETIME NULL,
    SAPanelidAfgerond DATETIME NULL,
    SAPanelidVolledig BIT NULL DEFAULT 0,
    SAPanelidHuidigeKamer INT NULL,
        CONSTRAINT CHK_SAPanelid_Kamer 
        CHECK (SAPanelidHuidigeKamer IS NULL OR SAPanelidHuidigeKamer BETWEEN 1 AND 8),
    SAPanelidAantalVoltooid INT NULL DEFAULT 0,
    
    -- Audit
    SAPanelidGewijzigdDoor NVARCHAR(255) NULL,
    SAPanelidGewijzigdOp DATETIME NULL,
    
    CONSTRAINT UQ_SAPanelid_Meta_Contact UNIQUE (SAPanelidMetaID, SAPanelidContactID)
);

CREATE INDEX IX_SAPanelid_Meta ON tbl_SensorischeAnalysePanelleden(SAPanelidMetaID);
CREATE INDEX IX_SAPanelid_Contact ON tbl_SensorischeAnalysePanelleden(SAPanelidContactID);
```

## Update Existing: `tbl_SensorischeAnalyse`

Link responses back to the analysis:

```sql
ALTER TABLE tbl_SensorischeAnalyse

-- Link to parent analysis
ADD SAMetaID UNIQUEIDENTIFIER NULL,
    CONSTRAINT FK_SA_Meta 
    FOREIGN KEY (SAMetaID) 
    REFERENCES tbl_SensorischeAnalyseMeta(SAMetaGUID);

-- Add room number
ADD SAKamerNummer INT NULL,
    CONSTRAINT CHK_SA_KamerNummer 
    CHECK (SAKamerNummer IS NULL OR SAKamerNummer BETWEEN 1 AND 8);

CREATE INDEX IX_SA_Meta ON tbl_SensorischeAnalyse(SAMetaID);
CREATE INDEX IX_SA_Meta_Panel ON tbl_SensorischeAnalyse(SAMetaID, SAPanelID);
```

## Complete Foreign Key Relationships

```
tbl_SensorischeAnalyseMeta (NEW - Main analysis)
├── SAMetaProjectID → tbl_Projecten(ProjectGUID)
└── SAMetaCoordinatorID → tbl_Contacten(ContactGUID)

tbl_SensorischeAnalyseKamers (NEW - Room assignments)
├── SAKamerMetaID → tbl_SensorischeAnalyseMeta(SAMetaGUID) [CASCADE]
├── SAKamerMonsterID → tbl_Monsters(MonsterGUID)
└── SAKamerMonsternameID → tbl_Monstername(MonsternameGUID)

tbl_SensorischeAnalysePanelleden (NEW - Panel members)
├── SAPanelidMetaID → tbl_SensorischeAnalyseMeta(SAMetaGUID) [CASCADE]
└── SAPanelidContactID → tbl_Contacten(ContactGUID)

tbl_SensorischeAnalyse (EXISTING - Updated with links)
├── SAMetaID → tbl_SensorischeAnalyseMeta(SAMetaGUID) [NEW]
├── SAMonsterID → tbl_Monsters(MonsterGUID) [EXISTING]
└── SAPanelID → tbl_Contacten(ContactGUID) [EXISTING]
```

This gives you the complete structure to move from cookies to database!
