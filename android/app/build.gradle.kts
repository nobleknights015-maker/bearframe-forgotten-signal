plugins {
    id("com.android.application")
}

val aeonOfflineBuild = (findProperty("aeonOfflineBuild")?.toString()?.toBoolean() == true)

android {
    namespace = "labs.bearframe.ghostsignal"
    compileSdk = 35
    buildFeatures { buildConfig = true }

    defaultConfig {
        applicationId = if (aeonOfflineBuild) "labs.bearframe.aeoncircuit" else "labs.bearframe.ghostsignal"
        minSdk = 26
        targetSdk = 35
        versionCode = 1
        versionName = if (aeonOfflineBuild) "2.0.0-aeon-offline" else "0.1.0-dev"
        buildConfigField("boolean", "LAUNCH_CAMPAIGN", aeonOfflineBuild.toString())
        manifestPlaceholders["appLabel"] = if (aeonOfflineBuild) {
            "Aeon Circuit: The Silent Wake"
        } else {
            "Bearframe Ghost Signal Engine"
        }
    }
    buildTypes {
        getByName("release") { isMinifyEnabled = false }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    sourceSets.getByName("main").assets.srcDir(layout.buildDirectory.dir("generated/ghost-signal"))
}

dependencies {
    implementation("androidx.webkit:webkit:1.12.1")
}

val copyGhostSignalAssets by tasks.registering(Sync::class) {
    val publicRoot = rootProject.file("../frontend/public")
    from(publicRoot) {
        if (!aeonOfflineBuild) {
            // Public builds MUST NEVER package private Bearframe/Aeon story or owner-only art.
            exclude(
                "assets/aeon/story/**",
                "assets/aeon/portraits/**",
                "assets/aeon/assets/world/**",
                "assets/aeon/assets/battlers/**"
            )
        }
    }
    into(layout.buildDirectory.dir("generated/ghost-signal"))
    doFirst {
        if (aeonOfflineBuild) {
            val campaignJson = File(publicRoot, "assets/aeon/story/campaign.json")
            val worldJson = File(publicRoot, "assets/aeon/story/opening-world-review-candidate.json")
            if (!campaignJson.isFile || !worldJson.isFile) {
                throw GradleException(
                    "Owner-private offline build requires compiled frontend/public/assets/aeon/story/{campaign.json,opening-world-review-candidate.json}. Run node frontend/narrative-tools/build_full_campaign.mjs first."
                )
            }
        }
    }
}
tasks.named("preBuild") { dependsOn(copyGhostSignalAssets) }
